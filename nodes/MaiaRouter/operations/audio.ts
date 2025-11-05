import { IExecuteFunctions, IDataObject, INodeExecutionData, INodeProperties, IHttpRequestOptions, NodeOperationError } from 'n8n-workflow';
import { requestWithHandling } from '../utils/http';

export const getAudioProperties = (): INodeProperties[] => [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['audio'] } },
        options: [
            { name: 'Generate audio', value: 'generateAudio', action: 'Generate audio', description: 'Generate audio from text using AI voice models' },
            { name: 'Transcribe audio', value: 'transcribeAudio', action: 'Transcribe audio', description: 'Convert audio to text using speech recognition' },
        ],
        default: 'generateAudio',
    },
    { displayName: 'Model', name: 'ttsModel', type: 'options', displayOptions: { show: { resource: ['audio'], operation: ['generateAudio'] } }, options: [ { name: 'OpenAI GPT-4o Mini TTS', value: 'openai/gpt-4o-mini-tts' }, { name: 'OpenAI TTS-1', value: 'openai/tts-1' }, { name: 'OpenAI TTS-1 HD', value: 'openai/tts-1-hd' }, { name: 'Gemini 2.5 Pro Preview TTS', value: 'maia/gemini-2.5-pro-preview-tts' } ], default: 'openai/gpt-4o-mini-tts', required: true, description: 'ID of the TTS model to use' },
    { displayName: 'Input Text', name: 'input', type: 'string', typeOptions: { rows: 4 }, displayOptions: { show: { resource: ['audio'], operation: ['generateAudio'] } }, default: '', required: true, description: 'The text to generate audio for. Maximum length is 4096 characters.' },
    { displayName: 'Voice', name: 'voice', type: 'options', displayOptions: { show: { resource: ['audio'], operation: ['generateAudio'] } }, options: [ { name: 'Alloy', value: 'alloy' }, { name: 'Echo', value: 'echo' }, { name: 'Fable', value: 'fable' }, { name: 'Onyx', value: 'onyx' }, { name: 'Nova', value: 'nova' }, { name: 'Shimmer', value: 'shimmer' } ], default: 'alloy', required: true },
    { displayName: 'Additional Fields', name: 'ttsAdditionalFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['audio'], operation: ['generateAudio'] } }, options: [ { displayName: 'Response Format', name: 'response_format', type: 'options', options: [ { name: 'MP3', value: 'mp3' }, { name: 'OPUS', value: 'opus' }, { name: 'AAC', value: 'aac' }, { name: 'FLAC', value: 'flac' }, { name: 'WAV', value: 'wav' }, { name: 'PCM', value: 'pcm' } ], default: 'mp3' }, { displayName: 'Speed', name: 'speed', type: 'number', typeOptions: { minValue: 0.25, maxValue: 4.0, numberPrecision: 2 }, default: 1.0 } ] },
    { displayName: 'Model', name: 'transcribeModel', type: 'options', displayOptions: { show: { resource: ['audio'], operation: ['transcribeAudio'] } }, options: [ { name: 'OpenAI GPT-4o Mini Transcribe', value: 'openai/gpt-4o-mini-transcribe' }, { name: 'Maia Whisper-1', value: 'maia/whisper-1' } ], default: 'openai/gpt-4o-mini-transcribe', required: true, description: 'ID of the transcription model to use' },
    { displayName: 'Input Data Mode', name: 'inputDataMode', type: 'options', displayOptions: { show: { resource: ['audio'], operation: ['transcribeAudio'] } }, options: [ { name: 'Binary File', value: 'binaryData' }, { name: 'Audio URL', value: 'url' } ], default: 'binaryData' },
    { displayName: 'Binary Property', name: 'binaryProperty', type: 'string', displayOptions: { show: { resource: ['audio'], operation: ['transcribeAudio'], inputDataMode: ['binaryData'] } }, default: 'data', required: true },
    { displayName: 'Audio URL', name: 'audioUrl', type: 'string', displayOptions: { show: { resource: ['audio'], operation: ['transcribeAudio'], inputDataMode: ['url'] } }, default: '', required: true },
    { displayName: 'Additional Fields', name: 'transcribeAdditionalFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['audio'], operation: ['transcribeAudio'] } }, options: [ { displayName: 'Language', name: 'language', type: 'string', default: '' }, { displayName: 'Prompt', name: 'prompt', type: 'string', typeOptions: { rows: 3 }, default: '' }, { displayName: 'Response Format', name: 'response_format', type: 'options', options: [ { name: 'JSON', value: 'json' }, { name: 'Text', value: 'text' }, { name: 'SRT', value: 'srt' }, { name: 'VTT', value: 'vtt' }, { name: 'Verbose JSON', value: 'verbose_json' } ], default: 'json' }, { displayName: 'Temperature', name: 'temperature', type: 'number', typeOptions: { minValue: 0, maxValue: 1, numberPrecision: 2 }, default: 0 } ] },
];

export async function executeAudio(ctx: IExecuteFunctions, i: number, returnData: INodeExecutionData[]): Promise<void> {
    const operation = ctx.getNodeParameter('operation', i) as string;
    const credentials = await ctx.getCredentials('maiaRouterApi');

    if (operation === 'generateAudio') {
        const model = ctx.getNodeParameter('ttsModel', i) as string;
        const input = ctx.getNodeParameter('input', i) as string;
        const voice = ctx.getNodeParameter('voice', i) as string;
        const additionalFields = ctx.getNodeParameter('ttsAdditionalFields', i) as IDataObject;
        const body: IDataObject = { model, input, voice };
        if (additionalFields.response_format !== undefined) body.response_format = additionalFields.response_format;
        if (additionalFields.speed !== undefined) body.speed = additionalFields.speed;

        const options = { method: 'POST', headers: { 'Authorization': `Bearer ${credentials.apiKey}`, 'Content-Type': 'application/json' }, body, url: 'https://api.maiarouter.ai/v1/audio/speech', encoding: 'arraybuffer', json: false };
        const response = await requestWithHandling(ctx, options as IHttpRequestOptions);

        // Handle the binary response properly - same pattern as working video download
        let audioBuffer: Buffer;

        if (Buffer.isBuffer(response)) {
            audioBuffer = response;
        } else if (response instanceof ArrayBuffer) {
            audioBuffer = Buffer.from(response);
        } else if (response && typeof response === 'object') {
            // Handle cases where response might be wrapped in an object
            if (response.data && Buffer.isBuffer(response.data)) {
                audioBuffer = response.data;
            } else if (response.buffer && (response.buffer instanceof ArrayBuffer || Buffer.isBuffer(response.buffer))) {
                audioBuffer = Buffer.from(response.buffer);
            } else {
                throw new NodeOperationError(ctx.getNode(), `Unexpected response format: ${JSON.stringify(Object.keys(response))}`, { itemIndex: i });
            }
        } else {
            throw new NodeOperationError(ctx.getNode(), `Invalid audio response type: ${typeof response}`, { itemIndex: i });
        }

        // Validate the buffer
        if (audioBuffer.length === 0) {
            throw new NodeOperationError(ctx.getNode(), 'Received empty audio buffer', { itemIndex: i });
        }

        const binaryData = await ctx.helpers.prepareBinaryData(audioBuffer, `speech.${additionalFields.response_format || 'mp3'}`, `audio/${additionalFields.response_format || 'mp3'}`);

        returnData.push({
            json: {
                success: true,
                model,
                voice,
                format: additionalFields.response_format || 'mp3',
                input: input,
                size: audioBuffer.length
            },
            binary: { data: binaryData },
            pairedItem: { item: i }
        });
        return;
    }

    if (operation === 'transcribeAudio') {
        const model = ctx.getNodeParameter('transcribeModel', i) as string;
        const inputDataMode = ctx.getNodeParameter('inputDataMode', i) as string;
        const additionalFields = ctx.getNodeParameter('transcribeAdditionalFields', i) as IDataObject;

        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const FormData = require('form-data');
        const multipart = new FormData();

        if (inputDataMode === 'binaryData') {
            const binaryPropertyName = ctx.getNodeParameter('binaryProperty', i) as string;
            const binaryData = ctx.helpers.assertBinaryData(i, binaryPropertyName);
            const binaryDataBuffer = await ctx.helpers.getBinaryDataBuffer(i, binaryPropertyName);
            multipart.append('file', binaryDataBuffer, { filename: binaryData.fileName || 'audio.mp3', contentType: binaryData.mimeType || 'audio/mpeg' });
            multipart.append('model', model);
        } else {
            const audioUrl = ctx.getNodeParameter('audioUrl', i) as string;
            const fileArrayBuffer = await requestWithHandling(ctx, { method: 'GET', url: audioUrl, encoding: 'arraybuffer' } as IHttpRequestOptions);
            const fileBuffer = Buffer.from(fileArrayBuffer as ArrayBuffer);
            multipart.append('file', fileBuffer, { filename: 'audio.mp3', contentType: 'audio/mpeg' });
            multipart.append('model', model);
        }

        if (additionalFields.language) multipart.append('language', additionalFields.language as string);
        if (additionalFields.prompt) multipart.append('prompt', additionalFields.prompt as string);
        if (additionalFields.response_format) multipart.append('response_format', additionalFields.response_format as string);
        if (additionalFields.temperature !== undefined) multipart.append('temperature', String(additionalFields.temperature));

        const options = { method: 'POST', headers: { ...multipart.getHeaders(), 'Authorization': `Bearer ${credentials.apiKey}` }, body: multipart, url: 'https://api.maiarouter.ai/v1/audio/transcriptions' };
        const response = await requestWithHandling(ctx, options as IHttpRequestOptions);
        returnData.push({ json: response, pairedItem: { item: i } });
    }
}



