import { IExecuteFunctions, IDataObject, INodeExecutionData, INodeProperties, IHttpRequestOptions, NodeOperationError } from 'n8n-workflow';
import { requestWithHandling } from '../utils/http';

export const getVideoProperties = (): INodeProperties[] => [
    { displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true, displayOptions: { show: { resource: ['video'] } }, options: [ { name: 'Generate Video', value: 'generateVideo', action: 'Generate Video', description: 'Generate video from text prompt using AI video models' } ], default: 'generateVideo' },
    { displayName: 'Mode', name: 'videoMode', type: 'options', noDataExpression: true, displayOptions: { show: { resource: ['video'], operation: ['generateVideo'] } }, options: [ { name: 'Start', value: 'start', description: 'Start a video generation job and return its ID' }, { name: 'Remix', value: 'remix', description: 'Remix an existing video with a new prompt' }, { name: 'Check Status', value: 'status', description: 'Check the status of a previously started job' }, { name: 'Download', value: 'download', description: 'Download the completed video' } ], default: 'start', description: 'Select how this node should behave to pair with the Wait node' },
    { displayName: 'Model', name: 'videoModel', type: 'options', displayOptions: { show: { resource: ['video'], operation: ['generateVideo'] } }, options: [ { name: 'OpenAI Sora 2', value: 'openai/sora-2' }, { name: 'OpenAI Sora 2 Pro', value: 'openai/sora-2-pro' }, { name: 'Veo 3.0', value: 'veo-3.0-generate-001' } ], default: 'openai/sora-2', required: true, description: 'The video generation model to use' },
    { displayName: 'Prompt', name: 'prompt', type: 'string', typeOptions: { rows: 4 }, displayOptions: { show: { resource: ['video'], operation: ['generateVideo'], videoMode: ['start', 'remix'] } }, default: '', required: true, description: 'The text prompt describing the video to generate' },
    { displayName: 'Input Reference', name: 'inputDataMode', type: 'options', displayOptions: { show: { resource: ['video'], operation: ['generateVideo'], videoMode: ['start']  } }, options: [{ name: 'Binary File', value: 'binaryData' }, { name: 'Image URL', value: 'url' }, { name: 'None', value: '' }], default: '' },
    { displayName: 'Binary Property', name: 'imageBinaryProperty', type: 'string', displayOptions: { show: { resource: ['video'], operation: ['generateVideo'], videoMode: ['start'], inputDataMode: ['binaryData'] } }, default: 'data', required: false, description: 'Binary property containing image reference for video generation (Sora 2 Pro only)', hint: 'Use "Add Expression" to select binary data from previous nodes' },
    { displayName: 'Image URL', name: 'imageUrl', type: 'string', displayOptions: { show: { resource: ['video'], operation: ['generateVideo'], videoMode: ['start'], inputDataMode: ['url'] } }, default: '', required: false, description: 'Image URL for video generation (Sora 2 Pro only)', placeholder: 'https://example.com/image.jpg' },
    { displayName: 'Video ID', name: 'videoId', type: 'string', displayOptions: { show: { resource: ['video'], operation: ['generateVideo'], videoMode: ['status','download','remix'], videoModel: ['openai/sora-2', 'openai/sora-2-pro'] } }, default: '', description: 'OpenAI video ID returned from Start (used for Sora models only)', hint: 'Use this field only for OpenAI Sora models' },
    { displayName: 'Operation Name', name: 'operationName', type: 'string', displayOptions: { show: { resource: ['video'], operation: ['generateVideo'], videoMode: ['status','download'], videoModel: ['veo-3.0-generate-001'] } }, default: '', description: 'Vertex AI operation name returned from Start (used for Veo models)', placeholder: 'projects/.../operations/...', hint: 'Required for Veo models when checking status or downloading' },
    { displayName: 'Size', name: 'size', type: 'options', displayOptions: { show: { resource: ['video'], operation: ['generateVideo'], videoMode: ['start'] } }, options: [ { name: '1280x720', value: '1280x720' }, { name: '1920x1080', value: '1920x1080' }, { name: '720x1280', value: '720x1280' }, { name: '1080x1920', value: '1080x1920' } ], default: '1280x720' },
    { displayName: 'Duration (Seconds)', name: 'seconds', type: 'options', options: [{ name: '8', value: 8 }, { name: '4', value: 4 }], default: 8, displayOptions: { show: { resource: ['video'], operation: ['generateVideo'], videoMode: ['start'] } }, required: false, description: 'Duration of the video in seconds' },
    { displayName: 'Additional Fields', name: 'videoAdditionalFields', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: { show: { resource: ['video'], operation: ['generateVideo'] } }, options: [ { displayName: 'Sample Count', name: 'sampleCount', type: 'string', default: '1' }, { displayName: 'Location', name: 'location', type: 'string', default: 'global' }, { displayName: 'Resume URL', name: 'resumeUrl', type: 'string', default: '' } ] },
];

export async function executeVideo(ctx: IExecuteFunctions, i: number, returnData: INodeExecutionData[]): Promise<void> {
    const mode = ctx.getNodeParameter('videoMode', i) as string;
    const model = ctx.getNodeParameter('videoModel', i) as string;
    const additionalFields = ctx.getNodeParameter('videoAdditionalFields', i) as IDataObject;
    const isOpenAI = model.includes('sora') || model.startsWith('openai/');
    const credentials = await ctx.getCredentials('maiaRouterApi');

    if (mode === 'start') {
        if (isOpenAI) {
            const prompt = ctx.getNodeParameter('prompt', i) as string;
            const size = ctx.getNodeParameter('size', i) as string || '1280x720';
            const seconds = ctx.getNodeParameter('seconds', i) as number || 8;
            const FormData = require('form-data');
            const multipart = new FormData();
            multipart.append('model', model);
            multipart.append('prompt', prompt);
            multipart.append('size', size);
            multipart.append('seconds', String(seconds));

            if (additionalFields.resumeUrl) multipart.append('resume_url', additionalFields.resumeUrl as string);

            // Add input reference if available
            await processInputReference(ctx, i, multipart);

            const requestOptions: IHttpRequestOptions = {
                method: 'POST',
                headers: { ...multipart.getHeaders(), 'Authorization': `Bearer ${credentials.apiKey}` },
                body: multipart,
                url: 'https://api.maiarouter.ai/v1/videos'
            };

            const createResponse = await requestWithHandling(ctx, requestOptions);
            returnData.push({ json: { success: true, mode, model, prompt, size, seconds, videoId: createResponse.id, status: createResponse.status || 'queued' }, pairedItem: { item: i } });
            return;
        }
        const prompt = ctx.getNodeParameter('prompt', i) as string;
        const sampleCount = parseInt((additionalFields.sampleCount as string) || '1');
        const body = { instances: [{ prompt }], parameters: { storageUri: 'gs://maiarouter/', sampleCount } };
        const url = `https://api.maiarouter.ai/vertex_ai/publishers/google/models/${model}:predictLongRunning`;
        const response = await requestWithHandling(ctx, { method: 'POST', headers: { 'x-litellm-api-key': credentials.apiKey as string }, body, url, json: true } as IHttpRequestOptions);
        returnData.push({ json: { success: true, mode, model, prompt, operationName: response.name, status: 'started' }, pairedItem: { item: i } });
        return;
    }

    if (mode === 'status') {
        if (isOpenAI) {
            const videoId = ctx.getNodeParameter('videoId', i) as string;
            if (!videoId) throw new NodeOperationError(ctx.getNode(), 'Video ID is required for status check', { itemIndex: i });
            const statusResponse = await requestWithHandling(ctx, { method: 'GET', headers: { 'Authorization': `Bearer ${credentials.apiKey}` }, url: `https://api.maiarouter.ai/v1/videos/${videoId}`, json: true } as IHttpRequestOptions);
            returnData.push({ json: { mode, model, videoId, ...statusResponse }, pairedItem: { item: i } });
            return;
        }
        const inputItems = ctx.getInputData();
        const inferredOpName = ((inputItems[i]?.json as IDataObject)?.operationName as string) || '';
        const providedOpName = ctx.getNodeParameter('operationName', i, '') as string;
        const operationName = providedOpName || inferredOpName;
        if (!operationName) throw new NodeOperationError(ctx.getNode(), 'Missing operation name. Pass the previous Start output (operationName) into this node or provide a Download URL.', { itemIndex: i });
        const statusUrl = `https://api.maiarouter.ai/vertex_ai/publishers/google/models/${model}:fetchPredictOperation`;
        const statusResponse = await requestWithHandling(ctx, { method: 'POST', headers: { 'x-litellm-api-key': credentials.apiKey as string }, body: { operationName }, url: statusUrl, json: true } as IHttpRequestOptions);
        let downloadUrl = '';
        if (statusResponse.response?.videos && Array.isArray(statusResponse.response.videos) && statusResponse.response.videos.length > 0) {
            const gcsUri = statusResponse.response.videos[0].gcsUri as string;
            if (gcsUri) downloadUrl = gcsUri.startsWith('gs://') ? gcsUri.replace('gs://', 'https://storage.googleapis.com/') : gcsUri;
        }
        returnData.push({ json: { mode, model, operationName, downloadUrl, ...statusResponse }, pairedItem: { item: i } });
        return;
    }

    if (mode === 'download') {
        if (isOpenAI) {
            const videoId = ctx.getNodeParameter('videoId', i) as string;
            if (!videoId) throw new NodeOperationError(ctx.getNode(), 'Video ID is required for download', { itemIndex: i });
            const videoBuffer = await requestWithHandling(ctx, { method: 'GET', headers: { 'Authorization': `Bearer ${credentials.apiKey}` }, url: `https://api.maiarouter.ai/v1/videos/${videoId}/content`, encoding: 'arraybuffer' } as IHttpRequestOptions);

            // Ensure proper buffer handling
            let finalBuffer: Buffer;
            if (videoBuffer instanceof Buffer) {
                finalBuffer = videoBuffer;
            } else if (videoBuffer instanceof ArrayBuffer) {
                finalBuffer = Buffer.from(videoBuffer);
            } else {
                finalBuffer = Buffer.from(videoBuffer);
            }

            const binaryData = await ctx.helpers.prepareBinaryData(finalBuffer, 'generated-video.mp4', 'video/mp4');
            returnData.push({
                json: {
                    success: true,
                    mode,
                    model,
                    videoId,
                    size: finalBuffer.length,
                    format: 'mp4'
                },
                binary: { data: binaryData },
                pairedItem: { item: i }
            });
            return;
        }
        let downloadUrl = '';
        const operationName = ctx.getNodeParameter('operationName', i, '') as string;
        if (!operationName) throw new NodeOperationError(ctx.getNode(), 'Missing operation name. Pass the previous Start output (operationName) for Veo download.', { itemIndex: i });
        const statusUrl = `https://api.maiarouter.ai/vertex_ai/publishers/google/models/${model}:fetchPredictOperation`;
        const statusResponse = await requestWithHandling(ctx, { method: 'POST', headers: { 'x-litellm-api-key': credentials.apiKey as string }, body: { operationName }, url: statusUrl, json: true } as IHttpRequestOptions);
        if (statusResponse.response?.videos && Array.isArray(statusResponse.response.videos) && statusResponse.response.videos.length > 0) {
            const gcsUri = statusResponse.response.videos[0].gcsUri as string;
            if (gcsUri) downloadUrl = gcsUri.startsWith('gs://') ? gcsUri.replace('gs://', 'https://storage.googleapis.com/') : gcsUri;
        }
        if (!downloadUrl) throw new NodeOperationError(ctx.getNode(), 'No download URL available', { itemIndex: i });
        const videoBuffer = await requestWithHandling(ctx, { method: 'GET', url: downloadUrl, encoding: 'arraybuffer' } as IHttpRequestOptions);

        // Ensure proper buffer handling
        let finalBuffer: Buffer;
        if (videoBuffer instanceof Buffer) {
            finalBuffer = videoBuffer;
        } else if (videoBuffer instanceof ArrayBuffer) {
            finalBuffer = Buffer.from(videoBuffer);
        } else {
            finalBuffer = Buffer.from(videoBuffer);
        }

        const binaryData = await ctx.helpers.prepareBinaryData(finalBuffer, 'generated-video.mp4', 'video/mp4');
        returnData.push({
            json: {
                success: true,
                mode,
                model,
                downloadUrl,
                size: finalBuffer.length,
                format: 'mp4'
            },
            binary: { data: binaryData },
            pairedItem: { item: i }
        });
        return;
    }

    if (mode === 'remix') {
        if (!isOpenAI) {
            throw new NodeOperationError(ctx.getNode(), 'Remix is only available for OpenAI Sora models', { itemIndex: i });
        }
        const videoId = ctx.getNodeParameter('videoId', i) as string;
        if (!videoId) throw new NodeOperationError(ctx.getNode(), 'Video ID is required for remix', { itemIndex: i });
        const prompt = ctx.getNodeParameter('prompt', i) as string;
        if (!prompt) throw new NodeOperationError(ctx.getNode(), 'Prompt is required for remix', { itemIndex: i });

        const remixResponse = await requestWithHandling(ctx, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${credentials.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: { prompt },
            url: `https://api.maiarouter.ai/v1/videos/${videoId}/remix`,
            json: true
        } as IHttpRequestOptions);

        returnData.push({
            json: {
                success: true,
                mode,
                model,
                previousVideoId: videoId,
                prompt,
                videoId: remixResponse.id,
                status: remixResponse.status || 'queued'
            },
            pairedItem: { item: i }
        });
        return;
    }
}


const getMimeTypeFromFileName = (fileName: string): string => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    const mimeTypeMap: { [key: string]: string } = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
        'tiff': 'image/tiff',
        'tif': 'image/tiff',
        'ico': 'image/x-icon',
        'heic': 'image/heic',
        'heif': 'image/heif'
    };
    return mimeTypeMap[extension] || 'image/jpeg';
};

async function processInputReference(ctx: IExecuteFunctions, i: number, multipart: any): Promise<void> {
    const inputMode = ctx.getNodeParameter('inputDataMode', i) as string;

    if (inputMode === 'none' || inputMode === '') {
        return;
    }

    if (inputMode === 'binaryData') {
        const imageBinaryProperty = ctx.getNodeParameter('imageBinaryProperty', i) as string;
        const binaryData = ctx.helpers.assertBinaryData(i, imageBinaryProperty);
        const binaryDataBuffer = await ctx.helpers.getBinaryDataBuffer(i, imageBinaryProperty);
        multipart.append('input_reference', binaryDataBuffer, {
            filename: binaryData.fileName || 'image.jpg',
            contentType: binaryData.mimeType || 'image/jpeg'
        });
    } else {
        const imageUrl = ctx.getNodeParameter('imageUrl', i) as string;
        if (!imageUrl) throw new NodeOperationError(ctx.getNode(), 'Image URL is required', { itemIndex: i });

        const fileArrayBuffer = await requestWithHandling(ctx, {
            method: 'GET',
            url: imageUrl,
            encoding: 'arraybuffer'
        } as IHttpRequestOptions);

        const fileBuffer = Buffer.from(fileArrayBuffer as ArrayBuffer);
        const fileName = imageUrl.split('/').pop() || 'image.jpg';
        const mimeType = getMimeTypeFromFileName(fileName);
        multipart.append('input_reference', fileBuffer, {
            filename: fileName,
            contentType: mimeType
        });
    }
}



