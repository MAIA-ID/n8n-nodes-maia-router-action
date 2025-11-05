import { IExecuteFunctions, IDataObject, INodeExecutionData, INodeProperties, IHttpRequestOptions, NodeOperationError } from 'n8n-workflow';
import { requestWithHandling } from '../utils/http';

export const getMessageProperties = (): INodeProperties[] => [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['chat'] } },
        options: [
            {
                name: 'Message a model',
                value: 'messageModel',
                action: 'Message a model',
                description: 'Generate a response using AI models',
                routing: { request: { method: 'POST', url: '/chat/completions' } },
            },
        ],
        default: 'messageModel',
    },
    {
        displayName: 'Model',
        name: 'model',
        type: 'string',
        displayOptions: { show: { resource: ['chat'], operation: ['messageModel'] } },
        default: 'maia/gemini-2.5-flash',
        required: true,
        description: 'ID of the model to use (e.g., maia/gemini-2.5-flash)',
    },
    {
        displayName: 'Messages',
        name: 'messages',
        type: 'fixedCollection',
        typeOptions: { multipleValues: true },
        displayOptions: { show: { resource: ['chat'], operation: ['messageModel'] } },
        default: {},
        placeholder: 'Add Message',
        options: [
            {
                name: 'messageValues',
                displayName: 'Message',
                values: [
                    {
                        displayName: 'Role',
                        name: 'role',
                        type: 'options',
                        options: [
                            { name: 'System', value: 'system' },
                            { name: 'User', value: 'user' },
                            { name: 'Assistant', value: 'assistant' },
                        ],
                        default: 'user',
                        description: 'The role of the message sender',
                    },
                    {
                        displayName: 'Content',
                        name: 'content',
                        type: 'string',
                        typeOptions: { rows: 4 },
                        default: '',
                        description: 'The content of the message',
                    },
                ],
            },
        ],
        description: 'Messages to send to the model',
    },
    {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        displayOptions: { show: { resource: ['chat'], operation: ['messageModel'] } },
        options: [
            { displayName: 'Temperature', name: 'temperature', type: 'number', typeOptions: { minValue: 0, maxValue: 2, numberPrecision: 2 }, default: 1 },
            { displayName: 'Max Tokens', name: 'max_tokens', type: 'number', default: 1000 },
            { displayName: 'Top P', name: 'top_p', type: 'number', typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 }, default: 1 },
            { displayName: 'Stream', name: 'stream', type: 'boolean', default: false },
            { displayName: 'Stop Sequences', name: 'stop', type: 'string', default: '' },
            { displayName: 'Presence Penalty', name: 'presence_penalty', type: 'number', typeOptions: { minValue: -2, maxValue: 2, numberPrecision: 2 }, default: 0 },
            { displayName: 'Frequency Penalty', name: 'frequency_penalty', type: 'number', typeOptions: { minValue: -2, maxValue: 2, numberPrecision: 2 }, default: 0 },
            {
                displayName: 'Tools',
                name: 'tools',
                type: 'fixedCollection',
                typeOptions: { multipleValues: true },
                default: {},
                placeholder: 'Add Tool',
                description: 'AI tools to enable for this request',
                options: [
                    {
                        name: 'toolValues',
                        displayName: 'Tool',
                        values: [
                            { displayName: 'Tool Type', name: 'toolType', type: 'options', options: [
                                { name: 'Google Maps', value: 'googleMaps' },
                                { name: 'URL Context', value: 'urlContext' },
                                { name: 'Code Execution', value: 'codeExecution' },
                                { name: 'Google Search', value: 'googleSearch' },
                            ], default: 'googleSearch' },
                            { displayName: 'Enable Widget', name: 'enableWidget', type: 'boolean', default: false, displayOptions: { show: { toolType: ['googleMaps'] } } },
                            { displayName: 'Latitude', name: 'latitude', type: 'number', default: 0, displayOptions: { show: { toolType: ['googleMaps'] } } },
                            { displayName: 'Longitude', name: 'longitude', type: 'number', default: 0, displayOptions: { show: { toolType: ['googleMaps'] } } },
                            { displayName: 'Language Code', name: 'languageCode', type: 'string', default: 'en_US', displayOptions: { show: { toolType: ['googleMaps'] } } },
                        ],
                    },
                ],
            },
        ],
    },
];

export async function executeMessage(ctx: IExecuteFunctions, i: number, returnData: INodeExecutionData[]): Promise<void> {
    const model = ctx.getNodeParameter('model', i) as string;
    const messagesData = ctx.getNodeParameter('messages', i) as IDataObject;
    const additionalFields = ctx.getNodeParameter('additionalFields', i) as IDataObject;

    const messages: IDataObject[] = [];
    if (messagesData.messageValues) {
        const messageValues = messagesData.messageValues as IDataObject[];
        for (const message of messageValues) {
            messages.push({ role: message.role, content: message.content });
        }
    }
    if (messages.length === 0) {
        throw new NodeOperationError(ctx.getNode(), 'At least one message is required', { itemIndex: i });
    }

    const body: IDataObject = { model, messages };
    if (additionalFields.temperature !== undefined) body.temperature = additionalFields.temperature;
    if (additionalFields.max_tokens !== undefined) body.max_tokens = additionalFields.max_tokens;
    if (additionalFields.top_p !== undefined) body.top_p = additionalFields.top_p;
    if (additionalFields.stream !== undefined) body.stream = additionalFields.stream;
    if (additionalFields.stop) body.stop = (additionalFields.stop as string).split(',').map((s) => s.trim());
    if (additionalFields.presence_penalty !== undefined) body.presence_penalty = additionalFields.presence_penalty;
    if (additionalFields.frequency_penalty !== undefined) body.frequency_penalty = additionalFields.frequency_penalty;
    if (additionalFields.tools) {
        const toolsConfig = additionalFields.tools as IDataObject;
        if (toolsConfig.toolValues) {
            const toolValues = toolsConfig.toolValues as IDataObject[];
            const tools: IDataObject[] = [];
            for (const tool of toolValues) {
                const toolType = tool.toolType as string;
                if (toolType === 'googleMaps') {
                    const googleMapsConfig: IDataObject = {};
                    if (tool.enableWidget !== undefined) googleMapsConfig.enableWidget = tool.enableWidget;
                    if (tool.latitude !== undefined) googleMapsConfig.latitude = tool.latitude;
                    if (tool.longitude !== undefined) googleMapsConfig.longitude = tool.longitude;
                    if (tool.languageCode) googleMapsConfig.languageCode = tool.languageCode;
                    tools.push({ googleMaps: googleMapsConfig });
                } else if (toolType === 'urlContext') {
                    tools.push({ urlContext: {} });
                } else if (toolType === 'codeExecution') {
                    tools.push({ codeExecution: {} });
                } else if (toolType === 'googleSearch') {
                    tools.push({ googleSearch: {} });
                }
            }
            if (tools.length > 0) body.tools = tools;
        }
    }

    const credentials = await ctx.getCredentials('maiaRouterApi');
    const options = {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${credentials.apiKey}` },
        body,
        url: 'https://api.maiarouter.ai/v1/chat/completions',
        json: true,
    };
    const response = await requestWithHandling(ctx, options as IHttpRequestOptions);
    returnData.push({ json: response, pairedItem: { item: i } });
}



