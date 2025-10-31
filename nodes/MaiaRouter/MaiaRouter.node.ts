import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	NodeOperationError,
	IRequestOptions,
	IHttpRequestOptions,
} from 'n8n-workflow';

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
				],
				default: 'chat',
			},
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['chat'],
					},
				},
				options: [
					{
						name: 'Message a model',
						value: 'messageModel',
						action: 'Message a model',
						description: 'Generate a response using AI models',
						routing: {
							request: {
								method: 'POST',
								url: '/chat/completions',
							},
						},
					},
				],
				default: 'messageModel',
			},
			// Audio Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['audio'],
					},
				},
				options: [
					{
						name: 'Text to Speech',
						value: 'textToSpeech',
						action: 'Convert text to speech',
						description: 'Generate audio from text using AI voice models',
					},
					{
						name: 'Transcribe',
						value: 'transcribe',
						action: 'Transcribe audio to text',
						description: 'Convert audio to text using speech recognition',
					},
				],
				default: 'textToSpeech',
			},
			{
				displayName: 'Model',
				name: 'model',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['messageModel'],
					},
				},
				default: 'maia/gemini-2.5-flash',
				required: true,
				description: 'ID of the model to use (e.g., maia/gemini-2.5-flash)',
			},
			{
				displayName: 'Messages',
				name: 'messages',
				type: 'fixedCollection',
				typeOptions: {
					multipleValues: true,
				},
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['messageModel'],
					},
				},
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
									{
										name: 'System',
										value: 'system',
									},
									{
										name: 'User',
										value: 'user',
									},
									{
										name: 'Assistant',
										value: 'assistant',
									},
								],
								default: 'user',
								description: 'The role of the message sender',
							},
							{
								displayName: 'Content',
								name: 'content',
								type: 'string',
								typeOptions: {
									rows: 4,
								},
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
				displayOptions: {
					show: {
						resource: ['chat'],
						operation: ['messageModel'],
					},
				},
				options: [
					{
						displayName: 'Temperature',
						name: 'temperature',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 2,
							numberPrecision: 2,
						},
						default: 1,
						description: 'Controls randomness. Lower is more deterministic, higher is more random.',
					},
					{
						displayName: 'Max Tokens',
						name: 'max_tokens',
						type: 'number',
						default: 1000,
						description: 'Maximum number of tokens to generate',
					},
					{
						displayName: 'Top P',
						name: 'top_p',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 1,
							numberPrecision: 2,
						},
						default: 1,
						description: 'Nucleus sampling parameter',
					},
					{
						displayName: 'Stream',
						name: 'stream',
						type: 'boolean',
						default: false,
						description: 'Whether to stream back partial progress',
					},
					{
						displayName: 'Stop Sequences',
						name: 'stop',
						type: 'string',
						default: '',
						description: 'Up to 4 sequences where the API will stop generating (comma-separated)',
					},
					{
						displayName: 'Presence Penalty',
						name: 'presence_penalty',
						type: 'number',
						typeOptions: {
							minValue: -2,
							maxValue: 2,
							numberPrecision: 2,
						},
						default: 0,
						description: 'Penalty for new tokens based on whether they appear in the text so far',
					},
					{
						displayName: 'Frequency Penalty',
						name: 'frequency_penalty',
						type: 'number',
						typeOptions: {
							minValue: -2,
							maxValue: 2,
							numberPrecision: 2,
						},
						default: 0,
						description: 'Penalty for new tokens based on their existing frequency in the text',
					},
					{
						displayName: 'Tools',
						name: 'tools',
						type: 'fixedCollection',
						typeOptions: {
							multipleValues: true,
						},
						default: {},
						placeholder: 'Add Tool',
						description: 'AI tools to enable for this request',
						options: [
							{
								name: 'toolValues',
								displayName: 'Tool',
								values: [
									{
										displayName: 'Tool Type',
										name: 'toolType',
										type: 'options',
										options: [
											{
												name: 'Google Maps',
												value: 'googleMaps',
												description: 'Enable Google Maps integration for location-based queries',
											},
											{
												name: 'URL Context',
												value: 'urlContext',
												description: 'Enable URL parsing and content extraction',
											},
											{
												name: 'Code Execution',
												value: 'codeExecution',
												description: 'Enable code execution capabilities',
											},
											{
												name: 'Google Search',
												value: 'googleSearch',
												description: 'Enable Google Search integration',
											},
										],
										default: 'googleSearch',
										description: 'Type of tool to enable',
									},
									{
										displayName: 'Enable Widget',
										name: 'enableWidget',
										type: 'boolean',
										default: false,
										displayOptions: {
											show: {
												toolType: ['googleMaps'],
											},
										},
										description: 'Whether to enable the Google Maps widget',
									},
									{
										displayName: 'Latitude',
										name: 'latitude',
										type: 'number',
										default: 0,
										displayOptions: {
											show: {
												toolType: ['googleMaps'],
											},
										},
										description: 'Latitude coordinate for Google Maps',
									},
									{
										displayName: 'Longitude',
										name: 'longitude',
										type: 'number',
										default: 0,
										displayOptions: {
											show: {
												toolType: ['googleMaps'],
											},
										},
										description: 'Longitude coordinate for Google Maps',
									},
									{
										displayName: 'Language Code',
										name: 'languageCode',
										type: 'string',
										default: 'en_US',
										displayOptions: {
											show: {
												toolType: ['googleMaps'],
											},
										},
										description: 'Language code for Google Maps (e.g., en_US, id_ID)',
									},
								],
							},
						],
					},
				],
			},
			// Text to Speech Parameters
			{
				displayName: 'Model',
				name: 'ttsModel',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['textToSpeech'],
					},
				},
				default: 'openai/gpt-4o-mini-tts',
				required: true,
				description: 'ID of the TTS model to use (e.g., maia/tts-1, maia/tts-1-hd)',
			},
			{
				displayName: 'Input Text',
				name: 'input',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['textToSpeech'],
					},
				},
				default: '',
				required: true,
				description: 'The text to generate audio for. Maximum length is 4096 characters.',
			},
			{
				displayName: 'Voice',
				name: 'voice',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['textToSpeech'],
					},
				},
				options: [
					{
						name: 'Alloy',
						value: 'alloy',
					},
					{
						name: 'Echo',
						value: 'echo',
					},
					{
						name: 'Fable',
						value: 'fable',
					},
					{
						name: 'Onyx',
						value: 'onyx',
					},
					{
						name: 'Nova',
						value: 'nova',
					},
					{
						name: 'Shimmer',
						value: 'shimmer',
					},
				],
				default: 'alloy',
				required: true,
				description: 'The voice to use for audio generation',
			},
			{
				displayName: 'Additional Fields',
				name: 'ttsAdditionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['textToSpeech'],
					},
				},
				options: [
					{
						displayName: 'Response Format',
						name: 'response_format',
						type: 'options',
						options: [
							{
								name: 'MP3',
								value: 'mp3',
							},
							{
								name: 'OPUS',
								value: 'opus',
							},
							{
								name: 'AAC',
								value: 'aac',
							},
							{
								name: 'FLAC',
								value: 'flac',
							},
							{
								name: 'WAV',
								value: 'wav',
							},
							{
								name: 'PCM',
								value: 'pcm',
							},
						],
						default: 'mp3',
						description: 'The format of the audio output',
					},
					{
						displayName: 'Speed',
						name: 'speed',
						type: 'number',
						typeOptions: {
							minValue: 0.25,
							maxValue: 4.0,
							numberPrecision: 2,
						},
						default: 1.0,
						description: 'The speed of the generated audio. Select a value from 0.25 to 4.0.',
					},
				],
			},
			// Transcribe Parameters
			{
				displayName: 'Model',
				name: 'transcribeModel',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['transcribe'],
					},
				},
				default: 'openai/gpt-4o-mini-transcribe',
				required: true,
				description: 'ID of the transcription model to use (e.g., maia/whisper-1)',
			},
			{
				displayName: 'Input Data Mode',
				name: 'inputDataMode',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['transcribe'],
					},
				},
				options: [
					{
						name: 'Binary File',
						value: 'binaryData',
						description: 'Audio file from previous node',
					},
					{
						name: 'Audio URL',
						value: 'url',
						description: 'URL of the audio file',
					},
				],
				default: 'binaryData',
				description: 'How to provide the audio data',
			},
			{
				displayName: 'Binary Property',
				name: 'binaryProperty',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['transcribe'],
						inputDataMode: ['binaryData'],
					},
				},
				default: 'data',
				required: true,
				description: 'Name of the binary property containing the audio file',
			},
			{
				displayName: 'Audio URL',
				name: 'audioUrl',
				type: 'string',
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['transcribe'],
						inputDataMode: ['url'],
					},
				},
				default: '',
				required: true,
				description: 'URL of the audio file to transcribe',
			},
			{
				displayName: 'Additional Fields',
				name: 'transcribeAdditionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['audio'],
						operation: ['transcribe'],
					},
				},
				options: [
					{
						displayName: 'Language',
						name: 'language',
						type: 'string',
						default: '',
						placeholder: 'en',
						description: 'The language of the input audio in ISO-639-1 format (e.g., en, es, fr)',
					},
					{
						displayName: 'Prompt',
						name: 'prompt',
						type: 'string',
						typeOptions: {
							rows: 3,
						},
						default: '',
						description: 'Optional text to guide the model\'s style or continue a previous audio segment',
					},
					{
						displayName: 'Response Format',
						name: 'response_format',
						type: 'options',
						options: [
							{
								name: 'JSON',
								value: 'json',
							},
							{
								name: 'Text',
								value: 'text',
							},
							{
								name: 'SRT',
								value: 'srt',
							},
							{
								name: 'VTT',
								value: 'vtt',
							},
							{
								name: 'Verbose JSON',
								value: 'verbose_json',
							},
						],
						default: 'json',
						description: 'The format of the transcript output',
					},
					{
						displayName: 'Temperature',
						name: 'temperature',
						type: 'number',
						typeOptions: {
							minValue: 0,
							maxValue: 1,
							numberPrecision: 2,
						},
						default: 0,
						description: 'The sampling temperature between 0 and 1',
					},
				],
			},
			// Video Operations
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['video'],
					},
				},
				options: [
					{
						name: 'Generate Video',
						value: 'textToVideo',
						action: 'Generate video from text',
						description: 'Generate video from text prompt using AI video models',
					},
				],
				default: 'textToVideo',
			},
			// Video Generation Parameters
			{
				displayName: 'Model',
				name: 'videoModel',
				type: 'options',
				displayOptions: {
					show: {
						resource: ['video'],
						operation: ['textToVideo'],
					},
				},
				options: [
					{
						name: 'OpenAI Sora 2',
						value: 'sora-2',
					},
					{
						name: 'OpenAI Sora 2 Pro',
						value: 'sora-2-pro',
					},
					// Disable until issue bucket fixed
					// {
					// 	name: 'Veo 3.0',
					// 	value: 'veo-3.0-generate-001',
					// },
				],
				default: 'sora-2',
				required: true,
				description: 'The video generation model to use',
			},
			{
				displayName: 'Prompt',
				name: 'prompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				displayOptions: {
					show: {
						resource: ['video'],
						operation: ['textToVideo'],
					},
				},
				default: '',
				required: true,
				description: 'The text prompt describing the video to generate',
			},
			{
				displayName: 'Additional Fields',
				name: 'videoAdditionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['video'],
						operation: ['textToVideo'],
					},
				},
				options: [
					{
						displayName: 'Size',
						name: 'size',
						type: 'options',
						options: [
							{
								name: '1280x720',
								value: '1280x720',
							},
							{
								name: '1920x1080',
								value: '1920x1080',
							},
							{
								name: '720x1280',
								value: '720x1280',
							},
							{
								name: '1080x1920',
								value: '1080x1920',
							},
						],
						default: '1280x720',
						description: 'Video resolution (for OpenAI-compatible models like Sora)',
					},
					{
						displayName: 'Duration (Seconds)',
						name: 'seconds',
						type: 'number',
						default: 8,
						description: 'Video duration in seconds (for OpenAI-compatible models like Sora)',
					},
					{
						displayName: 'Sample Count',
						name: 'sampleCount',
						type: 'string',
						default: '1',
						description: 'Number of video samples to generate (for Vertex AI models)',
					},
					{
						displayName: 'Project ID',
						name: 'projectId',
						type: 'string',
						default: 'learned-nimbus-473801-q8',
						description: 'Google Cloud project ID for Vertex AI (for Veo models)',
					},
					{
						displayName: 'Location',
						name: 'location',
						type: 'string',
						default: 'global',
						description: 'Google Cloud region/location (for Vertex AI models)',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (resource === 'chat') {
					if (operation === 'messageModel') {
						const model = this.getNodeParameter('model', i) as string;
						const messagesData = this.getNodeParameter('messages', i) as IDataObject;
						const additionalFields = this.getNodeParameter('additionalFields', i) as IDataObject;

						// Format messages
						const messages: IDataObject[] = [];
						if (messagesData.messageValues) {
							const messageValues = messagesData.messageValues as IDataObject[];
							for (const message of messageValues) {
								messages.push({
									role: message.role,
									content: message.content,
								});
							}
						}

						if (messages.length === 0) {
							throw new NodeOperationError(
								this.getNode(),
								'At least one message is required',
								{ itemIndex: i },
							);
						}

						// Build request body
						const body: IDataObject = {
							model,
							messages,
						};

						// Add additional fields
						if (additionalFields.temperature !== undefined) {
							body.temperature = additionalFields.temperature;
						}
						if (additionalFields.max_tokens !== undefined) {
							body.max_tokens = additionalFields.max_tokens;
						}
						if (additionalFields.top_p !== undefined) {
							body.top_p = additionalFields.top_p;
						}
						if (additionalFields.stream !== undefined) {
							body.stream = additionalFields.stream;
						}
						if (additionalFields.stop) {
							body.stop = (additionalFields.stop as string).split(',').map((s) => s.trim());
						}
						if (additionalFields.presence_penalty !== undefined) {
							body.presence_penalty = additionalFields.presence_penalty;
						}
						if (additionalFields.frequency_penalty !== undefined) {
							body.frequency_penalty = additionalFields.frequency_penalty;
						}

						// Add tools if configured
						if (additionalFields.tools) {
							const toolsConfig = additionalFields.tools as IDataObject;
							if (toolsConfig.toolValues) {
								const toolValues = toolsConfig.toolValues as IDataObject[];
								const tools: IDataObject[] = [];

								for (const tool of toolValues) {
									const toolType = tool.toolType as string;

									if (toolType === 'googleMaps') {
										const googleMapsConfig: IDataObject = {};
										if (tool.enableWidget !== undefined) {
											googleMapsConfig.enableWidget = tool.enableWidget;
										}
										if (tool.latitude !== undefined) {
											googleMapsConfig.latitude = tool.latitude;
										}
										if (tool.longitude !== undefined) {
											googleMapsConfig.longitude = tool.longitude;
										}
										if (tool.languageCode) {
											googleMapsConfig.languageCode = tool.languageCode;
										}
										tools.push({ googleMaps: googleMapsConfig });
									} else if (toolType === 'urlContext') {
										tools.push({ urlContext: {} });
									} else if (toolType === 'codeExecution') {
										tools.push({ codeExecution: {} });
									} else if (toolType === 'googleSearch') {
										tools.push({ googleSearch: {} });
									}
								}

								if (tools.length > 0) {
									body.tools = tools;
								}
							}
						}

						// Make API request
						const credentials = await this.getCredentials('maiaRouterApi');
						const options = {
							method: 'POST',
							headers: {
								'Authorization': `Bearer ${credentials.apiKey}`,
							},
							body: body,
							url: 'https://api.maiarouter.ai/v1/chat/completions',
							json: true,
						};

						const response = await this.helpers.httpRequest(options as IHttpRequestOptions);

						returnData.push({
							json: response,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'audio') {
					const credentials = await this.getCredentials('maiaRouterApi');

					if (operation === 'textToSpeech') {
						const model = this.getNodeParameter('ttsModel', i) as string;
						const input = this.getNodeParameter('input', i) as string;
						const voice = this.getNodeParameter('voice', i) as string;
						const additionalFields = this.getNodeParameter('ttsAdditionalFields', i) as IDataObject;

						// Build request body
						const body: IDataObject = {
							model,
							input,
							voice,
						};

						// Add additional fields
						if (additionalFields.response_format !== undefined) {
							body.response_format = additionalFields.response_format;
						}
						if (additionalFields.speed !== undefined) {
							body.speed = additionalFields.speed;
						}

						// Make API request
						const options = {
							method: 'POST',
							headers: {
								'Authorization': `Bearer ${credentials.apiKey}`,
								'Content-Type': 'application/json',
							},
							body: body,
							url: 'https://api.maiarouter.ai/v1/audio/speech',
							encoding: 'buffer', // Get response as buffer
							json: true,
						};

						const response = await this.helpers.httpRequest(options as IHttpRequestOptions);

						// Return audio as binary data
						const binaryData = await this.helpers.prepareBinaryData(
							Buffer.from(response as string),
							`audio.${additionalFields.response_format || 'mp3'}`,
							`audio/${additionalFields.response_format || 'mp3'}`,
						);

						returnData.push({
							json: {
								success: true,
								model,
								voice,
								format: additionalFields.response_format || 'mp3',
							},
							binary: {
								data: binaryData,
							},
							pairedItem: { item: i },
						});
					} else if (operation === 'transcribe') {
						const model = this.getNodeParameter('transcribeModel', i) as string;
						const inputDataMode = this.getNodeParameter('inputDataMode', i) as string;
						const additionalFields = this.getNodeParameter('transcribeAdditionalFields', i) as IDataObject;

						let formData: any = {};

						// Handle audio input
						if (inputDataMode === 'binaryData') {
							const binaryPropertyName = this.getNodeParameter('binaryProperty', i) as string;
							const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);

							// Get binary data buffer
							const binaryDataBuffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

							// Set up formData with proper file structure
							formData = {
								file: {
									value: binaryDataBuffer,
									options: {
										filename: binaryData.fileName || 'audio.mp3',
										contentType: binaryData.mimeType || 'audio/mpeg',
									},
								},
								model: model,
							};
						} else if (inputDataMode === 'url') {
							// For URL mode, download the file first then upload it
							const audioUrl = this.getNodeParameter('audioUrl', i) as string;

							const fileBuffer = await this.helpers.httpRequest({
								method: 'GET',
								url: audioUrl,
								encoding: 'arraybuffer',
							} as IHttpRequestOptions);

							formData = {
								file: {
									value: fileBuffer,
									options: {
										filename: 'audio.mp3',
										contentType: 'audio/mpeg',
									},
								},
								model: model,
							};
						}

						// Add additional fields as strings
						if (additionalFields.language) {
							formData.language = additionalFields.language as string;
						}
						if (additionalFields.prompt) {
							formData.prompt = additionalFields.prompt as string;
						}
						if (additionalFields.response_format) {
							formData.response_format = additionalFields.response_format as string;
						}
						if (additionalFields.temperature !== undefined) {
							formData.temperature = String(additionalFields.temperature);
						}

						// Make API request
						const options = {
							method: 'POST',
							headers: {
								'Authorization': `Bearer ${credentials.apiKey}`,
							},
							formData: formData,
							url: 'https://api.maiarouter.ai/v1/audio/transcriptions',
							json: true,
						};

						const response = await this.helpers.httpRequest(options as IHttpRequestOptions);

						returnData.push({
							json: response,
							pairedItem: { item: i },
						});
					}
				} else if (resource === 'video') {
					const credentials = await this.getCredentials('maiaRouterApi');

					if (operation === 'textToVideo') {
						const model = this.getNodeParameter('videoModel', i) as string;
						const prompt = this.getNodeParameter('prompt', i) as string;
						const additionalFields = this.getNodeParameter('videoAdditionalFields', i) as IDataObject;

						// Detect if this is an OpenAI-compatible model (Sora) or Vertex AI (Veo)
						const isOpenAI = model.includes('sora') || model.startsWith('openai/');

						if (isOpenAI) {
							// OpenAI Video Generation API (Sora)
							// API Flow: POST /v1/videos -> Poll GET /v1/videos/{id} -> Download GET /v1/videos/{id}/content
							const size = additionalFields.size as string || '1280x720';
							const seconds = additionalFields.seconds as number || 8;

							const body = {
								model,
								prompt,
								size,
								seconds: String(seconds), // API expects string "4", "8", or "12"
							};

							// Step 1: Create video generation job
							const createOptions = {
								method: 'POST',
								headers: {
									'Authorization': `Bearer ${credentials.apiKey}`,
								},
								body: body,
								url: 'https://api.maiarouter.ai/openai/v1/videos',
								json: true,
							};

							const createResponse = await this.helpers.httpRequest(createOptions as IHttpRequestOptions);

							// Extract video ID from response
							const videoId = createResponse.id;
							if (!videoId) {
								throw new NodeOperationError(
									this.getNode(),
									'No video ID returned from OpenAI video generation API',
									{ itemIndex: i },
								);
							}

							// Step 2: Poll for video completion
							let videoComplete = false;
							let videoStatus = '';
							let attempts = 0;
							const maxAttempts = 60; // Poll for up to 10 minutes
							const pollInterval = 10000; // 10 seconds

							while (!videoComplete && attempts < maxAttempts) {
								attempts++;

								// Wait before polling
								await new Promise(resolve => setTimeout(resolve, pollInterval));

								// Check video status
								const statusOptions = {
									method: 'GET',
									headers: {
										'Authorization': `Bearer ${credentials.apiKey}`,
									},
									url: `https://api.maiarouter.ai/openai/v1/videos/${videoId}`,
									json: true,
								};

								const statusResponse = await this.helpers.httpRequest(statusOptions as IHttpRequestOptions);
								videoStatus = statusResponse.status;

								// Check if video is completed
								if (videoStatus === 'completed') {
									videoComplete = true;
								} else if (videoStatus === 'failed') {
									throw new NodeOperationError(
										this.getNode(),
										`Video generation failed: ${statusResponse.error || 'Unknown error'}`,
										{ itemIndex: i },
									);
								}
								// Continue polling if status is 'queued' or 'in_progress'
							}

							if (!videoComplete) {
								throw new NodeOperationError(
									this.getNode(),
									`Video generation timed out after ${maxAttempts * pollInterval / 1000} seconds. Last status: ${videoStatus}`,
									{ itemIndex: i },
								);
							}

							// Step 3: Download the video using GET /videos/{video_id}/content
							const videoBuffer = await this.helpers.httpRequest({
								method: 'GET',
								headers: {
									'Authorization': `Bearer ${credentials.apiKey}`,
								},
								url: `https://api.maiarouter.ai/openai/v1/videos/${videoId}/content`,
								encoding: 'arraybuffer',
							} as IHttpRequestOptions);

							// Prepare binary data
							const binaryData = await this.helpers.prepareBinaryData(
								Buffer.from(videoBuffer as ArrayBuffer),
								'generated-video.mp4',
								'video/mp4',
							);

							returnData.push({
								json: {
									success: true,
									model,
									prompt,
									size,
									seconds,
									videoId,
									status: 'completed',
								},
								binary: {
									data: binaryData,
								},
								pairedItem: { item: i },
							});
						} else {
							// Vertex AI Video Generation (Veo)
							const projectId = additionalFields.projectId as string || 'learned-nimbus-473801-q8';
							const location = additionalFields.location as string || 'global';
							const sampleCount = parseInt(additionalFields.sampleCount as string || '1');

							// Build request body
							const body = {
								instances: [{ prompt }],
								parameters: {
									storageUri: 'gs://maiarouter/',
									sampleCount,
								},
							};

							// Build dynamic URL
							const url = `https://api.maiarouter.ai/vertex_ai/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:predictLongRunning`;

							// Make API request to start video generation
							const options = {
								method: 'POST',
								headers: {
									'x-litellm-api-key': credentials.apiKey as string,
								},
								body: body,
								url,
								json: true,
							};

							const response = await this.helpers.httpRequest(options as IHttpRequestOptions);

							// Extract operation name from response
							const operationName = response.name as string;

							if (!operationName) {
								throw new NodeOperationError(
									this.getNode(),
									'No operation name returned from video generation API',
									{ itemIndex: i },
								);
							}

							// Poll the operation status
							const statusUrl = `https://api.maiarouter.ai/vertex_ai/v1/projects/${projectId}/locations/${location}/publishers/google/models/${model}:fetchPredictOperation`;
							let operationComplete = false;
							let videoUrl = '';
							let allVideos: any[] = [];
							let attempts = 0;
							const maxAttempts = 60; // Poll for up to 10 minutes (60 attempts * 10 seconds)
							const pollInterval = 10000; // 10 seconds

							while (!operationComplete && attempts < maxAttempts) {
								attempts++;

								// Wait before polling
								await new Promise(resolve => setTimeout(resolve, pollInterval));

								// Check operation status with POST request
								const statusOptions = {
									method: 'POST',
									headers: {
										'x-litellm-api-key': credentials.apiKey as string,
									},
									body: {
										operationName: operationName,
									},
									url: statusUrl,
									json: true,
								};

								const statusResponse = await this.helpers.httpRequest(statusOptions as IHttpRequestOptions);

								// Check if operation is done
								if (statusResponse.done === true) {
									operationComplete = true;

									// Check for errors first
									if (statusResponse.error) {
										throw new NodeOperationError(
											this.getNode(),
											`Video generation failed: ${JSON.stringify(statusResponse.error)}`,
											{ itemIndex: i },
										);
									}

									// Extract videos from response.videos array
									if (statusResponse.response?.videos && Array.isArray(statusResponse.response.videos)) {
										allVideos = statusResponse.response.videos;
										// Get the first video URL
										if (allVideos.length > 0 && allVideos[0].gcsUri) {
											videoUrl = allVideos[0].gcsUri;
										}
									}
								}
							}

							if (!operationComplete) {
								throw new NodeOperationError(
									this.getNode(),
									`Video generation timed out after ${maxAttempts * pollInterval / 1000} seconds`,
									{ itemIndex: i },
								);
							}

							if (!videoUrl) {
								throw new NodeOperationError(
									this.getNode(),
									'No video URL found in completed operation response',
									{ itemIndex: i },
								);
							}

							// Convert gs:// URL to HTTPS URL
							let downloadUrl = videoUrl;
							if (videoUrl.startsWith('gs://')) {
								downloadUrl = videoUrl.replace('gs://', 'https://storage.googleapis.com/');
							}

							// Download the video
							const videoBuffer = await this.helpers.httpRequest({
								method: 'GET',
								url: downloadUrl,
								encoding: 'arraybuffer',
							} as IHttpRequestOptions);

							// Prepare binary data
							const binaryData = await this.helpers.prepareBinaryData(
								Buffer.from(videoBuffer as ArrayBuffer),
								'generated-video.mp4',
								'video/mp4',
							);

							returnData.push({
								json: {
									success: true,
									model,
									prompt,
									operationName,
									gcsUri: videoUrl,
									downloadUrl: downloadUrl,
									videos: allVideos,
									totalVideos: allVideos.length,
									status: 'completed',
								},
								binary: {
									data: binaryData,
								},
								pairedItem: { item: i },
							});
						}
					}
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
