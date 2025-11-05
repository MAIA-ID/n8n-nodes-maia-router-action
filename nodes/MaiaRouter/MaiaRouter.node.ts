import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { getImageProperties, executeImage } from './operations/image';
import { getAudioProperties, executeAudio } from './operations/audio';
import { getVideoProperties, executeVideo } from './operations/video';
import { getMessageProperties, executeMessage } from './operations/message';

export class MaiaRouter implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Maia Router',
		name: 'maiaRouter',
		icon: 'file:maiaRouter.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Maia Router API for AI model routing',
		defaults: {
			name: 'Maia Router',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'maiaRouterApi',
				required: true,
			},
		],
		requestDefaults: {
			baseURL: 'https://api.maiarouter.ai/v1',
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
			},
		},
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Chat',
						value: 'chat',
					},
					{
						name: 'Audio',
						value: 'audio',
					},
					{
						name: 'Video',
						value: 'video',
					},
					{
						name: 'Image',
						value: 'image',
					},
				],
				default: 'chat',
			},
			...getAudioProperties(),
			...getVideoProperties(),
			...getMessageProperties(),
			...getImageProperties(),
		],
	};


	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'chat') {
					await executeMessage(this, i, returnData);
				} else if (resource === 'audio') {
					await executeAudio(this, i, returnData);
				} else if (resource === 'video') {
					await executeVideo(this, i, returnData);
				} else if (resource === 'image') {
					await executeImage(this, i, returnData);
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error)?.message || 'Internal server error',
						},
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}