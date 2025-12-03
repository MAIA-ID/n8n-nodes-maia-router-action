import { IExecuteFunctions, IDataObject, INodeExecutionData, INodeProperties, IHttpRequestOptions, NodeOperationError, IBinaryKeyData } from 'n8n-workflow';
import { requestWithHandling } from '../utils/http';
import { getProvider } from '../utils/helper';

export const getImageProperties = (): INodeProperties[] => [
    {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        displayOptions: { show: { resource: ['image'] } },
        options: [
            { name: 'Generate image', value: 'generateImage', action: 'Generate image', description: 'Generate an image from a text prompt' },
            { name: 'Edit Image', value: 'editImage', action: 'Edit image', description: 'Edit or inpaint an image using a prompt and optional mask' },
        ],
        default: 'generateImage',
    },
    // Generate image
    { displayName: 'Model', name: 'imageModel', type: 'options', displayOptions: { show: { resource: ['image'], operation: ['generateImage'] } }, options: [{ name: 'GPT Image 1', value: 'openai/gpt-image-1' }, { name: 'Gemini Nano Banana', value: 'maia/gemini-2.5-flash-image-preview' }, { name: 'Gemini Nano Banana Pro', value: 'maia/gemini-3-pro-image-preview' }], default: 'openai/gpt-image-1', required: true, description: 'ID of the image model to use' },
    { displayName: 'Prompt', name: 'prompt', type: 'string', typeOptions: { rows: 4 }, displayOptions: { show: { resource: ['image'], operation: ['generateImage'] } }, default: '', required: true, description: 'Text prompt describing the desired image' },
    { displayName: 'Aspect Ratio', name: 'aspectRatio', type: 'options',displayOptions: { show: { resource: ['image'], operation: ['generateImage'], imageModel: ['maia/gemini-2.5-flash-image-preview', 'maia/gemini-3-pro-image-preview'] } }, options: [{ name: '1:1 (Square)', value: '1:1' }, { name: '9:16 (Portrait)',  value: '9:16' }, { name: '16:9 (Landscape)', value: '16:9' }, { name:'3:4 (Portrait)', value: '3:4' }, { name: '4:3 (Landscape)', value: '4:3' }], default: '1:1' },
    { displayName: 'N (Number of Images)', name: 'n', type: 'number', typeOptions: { minValue: 1, maxValue: 10 }, default: 1, displayOptions: { show: { resource: ['image'], operation: ['generateImage'], imageModel: ['openai/gpt-image-1'] } }, },
    { displayName: 'Size', name: 'size', type: 'options', displayOptions: { show: { resource: ['image'], operation: ['generateImage'], imageModel: ['openai/gpt-image-1'] } }, options: [{ name: '1536x1024 (Landscape)', value: '1536x1024' }, { name: '1024x1024 (Square)', value: '1024x1024' }, { name: '1024x1536 (Portrait)', value: '1024x1536' }, { name: '1024x1792 (Portrait)', value: '1024x1792' }, { name: '1792x1024 (Landscape)', value: '1792x1024' }], default: '1024x1024' },
    { displayName: 'Quality', name: 'quality', type: 'options', displayOptions: { show: { resource: ['image'], operation: ['generateImage'], imageModel: ['openai/gpt-image-1'] } }, options: [{ name: 'Auto', value: 'auto' }, { name: 'High', value: 'high' }, { name: 'Medium', value: 'medium' }, { name: 'Low', value: 'low' }], default: 'auto' },

    // Edit Image
    { displayName: 'Model', name: 'editImageModel', type: 'options', displayOptions: { show: { resource: ['image'], operation: ['editImage'] } }, options: [{ name: 'GPT Image 1', value: 'openai/gpt-image-1' }, { name: 'Gemini Nano Banana', value: 'maia/gemini-2.5-flash-image-preview' }, { name: 'Gemini Nano Banana Pro', value: 'maia/gemini-3-pro-image-preview' }], default: 'openai/gpt-image-1', required: true },
    { displayName: 'Prompt', name: 'editPrompt', type: 'string', typeOptions: { rows: 4 }, displayOptions: { show: { resource: ['image'], operation: ['editImage'] } }, default: '', required: true, description: 'Instruction describing the desired edit' },
    { displayName: 'Input Data Mode', name: 'editInputMode', type: 'options', displayOptions: { show: { resource: ['image'], operation: ['editImage'] } }, options: [{ name: 'Binary File', value: 'binaryData' }, { name: 'Image URL', value: 'url' }], default: 'binaryData' },
    { displayName: 'Binary Property', name: 'imageBinaryProperty', type: 'string', displayOptions: { show: { resource: ['image'], operation: ['editImage'], editInputMode: ['binaryData'] } }, default: 'data', required: true },
    { displayName: 'Image URL', name: 'imageUrl', type: 'string', displayOptions: { show: { resource: ['image'], operation: ['editImage'], editInputMode: ['url'] } }, default: '', required: true },
    { displayName: 'Aspect Ratio', name: 'editAspectRatio', type: 'options',displayOptions: { show: { resource: ['image'], operation: ['editImage'], editImageModel: ['maia/gemini-2.5-flash-image-preview', 'maia/gemini-3-pro-image-preview'] } }, options: [{ name: '1:1 (Square)', value: '1:1' }, { name: '9:16 (Portrait)',  value: '9:16' }, { name: '16:9 (Landscape)', value: '16:9' }, { name:'3:4 (Portrait)', value: '3:4' }, { name: '4:3 (Landscape)', value: '4:3' }], default: '1:1' },
    { displayName: 'Quality', name: 'editQuality', type: 'options', displayOptions: { show: { resource: ['image'], operation: ['editImage'], editImageModel: ['openai/gpt-image-1'] } }, options: [{ name: 'Auto', value: 'auto' },  { name: 'High', value: 'high' }, { name: 'Medium', value: 'medium' }, { name: 'Low', value: 'low' }], default: 'auto' },
    { displayName: 'N (Number of Images)', name: 'nEdit', type: 'number', typeOptions: { minValue: 1, maxValue: 10 }, default: 1, displayOptions: { show: { resource: ['image'], operation: ['editImage'], editImageModel: ['openai/gpt-image-1'] } }, },
    { displayName: 'Size', name: 'editSize', type: 'options', displayOptions: { show: { resource: ['image'], operation: ['editImage'], editImageModel: ['openai/gpt-image-1'] } }, options: [{ name: '256x256', value: '256x256' }, { name: '512x512', value: '512x512' }, { name: '1024x1024', value: '1024x1024' }], default: '1024x1024' },
   
];

export async function executeImage(ctx: IExecuteFunctions, i: number, returnData: INodeExecutionData[]): Promise<void> {
    const operation = ctx.getNodeParameter('operation', i) as string;
    const credentials = await ctx.getCredentials('maiaRouterApi');

    if (operation === 'generateImage') {
        const model = ctx.getNodeParameter('imageModel', i) as string;
        const prompt = ctx.getNodeParameter('prompt', i) as string;
        
        let body: IDataObject = {};
        let url = '';
        const provider = getProvider(model);   
        switch (provider) {
            case 'gemini':
                url = 'https://api.maiarouter.ai/v1/chat/completions';
                body = { model, messages: [{ role: 'user', content: prompt }] };
                const aspectRatio = ctx.getNodeParameter('aspectRatio', i) as string;
                if (aspectRatio) body['imageConfig'] = { ... (body['imageConfig'] as IDataObject || {}), aspectRatio };
                break;
            default:
                body = { model, prompt };
                const size = ctx.getNodeParameter('size', i) as string;
                const n = ctx.getNodeParameter('n', i) as number;
                const quality = ctx.getNodeParameter('quality', i) as string;
                if (size) body.size = size;
                if (n !== undefined) body.n = n;        
                if (quality) body.quality = quality;
                url = 'https://api.maiarouter.ai/v1/images/generations';
        }

        const options = {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${credentials.apiKey}` },
            body,
            url,
            json: true,
        } as IHttpRequestOptions;
        const response = await requestWithHandling(ctx, options);

        // Handle different response formats
        let processedResponse: IDataObject;
        const binaryData: IBinaryKeyData = {};

        // Handle images/generations endpoint response (OpenAI-style)
        if (response && response.data && Array.isArray(response.data)) {
            const processedImages = [];

            for (let j = 0; j < response.data.length; j++) {
                const imageData = response.data[j];
                const processedImage: IDataObject = {
                    revised_prompt: imageData.revised_prompt,
                    url: imageData.url
                };

                // Convert base64 to binary data if present
                if (imageData.b64_json) {
                    try {
                        const imageBuffer = Buffer.from(imageData.b64_json, 'base64');
                        const binaryFileName = `generated-image-${j + 1}.png`;
                        const binaryItem = await ctx.helpers.prepareBinaryData(
                            imageBuffer,
                            binaryFileName,
                            'image/png'
                        );
                        binaryData[`image_${j + 1}`] = binaryItem;
                        processedImage.binary_property = `image_${j + 1}`;
                    } catch (error) {
                        ctx.logger.error(`Failed to process base64 image ${j + 1}: ${error}`);
                        processedImage.error = 'Failed to process base64 image data';
                    }
                }

                processedImages.push(processedImage);
            }

            processedResponse = {
                created: response.created,
                background: response.background,
                output_format: response.output_format,
                quality: response.quality,
                size: response.size,
                usage: response.usage,
                images: processedImages,
                total_images: processedImages.length,
                model: model,
                response_type: 'images/generations'
            };
        }
        // Handle chat/completions endpoint response (Gemini-style)
        else if (response && response.choices && Array.isArray(response.choices) && response.choices.length > 0) {
            const choice = response.choices[0];
            const message = choice.message;
            const processedImages = [];

            if (message && message.images && Array.isArray(message.images)) {
                for (let j = 0; j < message.images.length; j++) {
                    const imageData = message.images[j];
                    const processedImage: IDataObject = {
                        index: imageData.index,
                        type: imageData.type
                    };

                    // Convert base64 URL to binary data if present
                    if (imageData.image_url && imageData.image_url.url) {
                        try {
                            const base64Data = imageData.image_url.url.replace(/^data:image\/[a-z]+;base64,/, '');
                            const imageBuffer = Buffer.from(base64Data, 'base64');
                            const binaryFileName = `generated-image-${j + 1}.png`;
                            const binaryItem = await ctx.helpers.prepareBinaryData(
                                imageBuffer,
                                binaryFileName,
                                'image/png'
                            );
                            binaryData[`image_${j + 1}`] = binaryItem;
                            processedImage.binary_property = `image_${j + 1}`;
                        } catch (error) {
                            ctx.logger.error(`Failed to process base64 image from Gemini ${j + 1}: ${error}`);
                            processedImage.error = 'Failed to process base64 image data';
                        }
                    }

                    processedImages.push(processedImage);
                }
            }

            processedResponse = {
                id: response.id,
                created: response.created,
                model: response.model,
                object: response.object,
                finish_reason: choice.finish_reason,
                usage: response.usage,
                images: processedImages,
                total_images: processedImages.length,
                thinking_blocks: message?.thinking_blocks || [],
                vertex_ai_grounding_metadata: response.vertex_ai_grounding_metadata,
                vertex_ai_url_context_metadata: response.vertex_ai_url_context_metadata,
                vertex_ai_safety_results: response.vertex_ai_safety_results,
                vertex_ai_citation_metadata: response.vertex_ai_citation_metadata,
                response_type: 'chat/completions'
            };
        }
        // Fallback for unexpected response formats
        else {
            processedResponse = {
                raw_response: response,
                response_type: 'unknown',
                model: model
            };
        }

        returnData.push({
            json: processedResponse,
            binary: Object.keys(binaryData).length > 0 ? binaryData : undefined,
            pairedItem: { item: i }
        });

        return;
    }

    if (operation === 'editImage') {
        const model = ctx.getNodeParameter('editImageModel', i) as string;
        const prompt = ctx.getNodeParameter('editPrompt', i) as string;
        const inputMode = ctx.getNodeParameter('editInputMode', i) as string;
        const provider = getProvider(model);
        // Handle Gemini model differently
        if (provider === 'gemini') {
            // Build content array for Gemini
            const content: any[] = [
                { type: "text", text: prompt }
            ];

            const imageConfig : any = {};
            const aspectRatio = ctx.getNodeParameter('editAspectRatio', i) as string;
            if (aspectRatio) imageConfig.aspectRatio = aspectRatio;
            // Add main image
            if (inputMode === 'binaryData') {
                const imageBinaryProperty = ctx.getNodeParameter('imageBinaryProperty', i) as string;
                const binaryData = ctx.helpers.assertBinaryData(i, imageBinaryProperty);
                const imageBuffer = await ctx.helpers.getBinaryDataBuffer(i, imageBinaryProperty);
                const base64Image = imageBuffer.toString('base64');
                const mimeType = binaryData.mimeType || 'image/png';

                content.push({
                    type: "image_url",
                    image_url: `data:${mimeType};base64,${base64Image}`
                });
            } else {
                const imageUrl = ctx.getNodeParameter('imageUrl', i) as string;
                if (!imageUrl) throw new NodeOperationError(ctx.getNode(), 'Image URL is required', { itemIndex: i });
                content.push({
                    type: "image_url",
                    image_url: imageUrl
                });
            }


            const body = {
                model,
                messages: [
                    {
                        role: "user",
                        content
                    }
                ],
                ...(imageConfig && Object.keys(imageConfig).length && { imageConfig })
            };

            const options = {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${credentials.apiKey}` },
                body,
                url: 'https://api.maiarouter.ai/v1/chat/completions',
                json: true,
            } as IHttpRequestOptions;

            const response = await requestWithHandling(ctx, options);

            // Handle Gemini response format (same as generate image)
            if (response && response.choices && Array.isArray(response.choices) && response.choices.length > 0) {
                const choice = response.choices[0];
                const message = choice.message;
                const processedImages = [];

                if (message && message.images && Array.isArray(message.images)) {
                    for (let j = 0; j < message.images.length; j++) {
                        const imageData = message.images[j];
                        const processedImage: IDataObject = {
                            index: imageData.index,
                            type: imageData.type
                        };

                        // Convert base64 URL to binary data if present
                        if (imageData.image_url && imageData.image_url.url) {
                            try {
                                const base64Data = imageData.image_url.url.replace(/^data:image\/[a-z]+;base64,/, '');
                                const imageBuffer = Buffer.from(base64Data, 'base64');
                                const binaryFileName = `edited-image-${j + 1}.png`;
                                const binaryItem = await ctx.helpers.prepareBinaryData(
                                    imageBuffer,
                                    binaryFileName,
                                    'image/png'
                                );
                                const binaryData: IBinaryKeyData = {};
                                binaryData[`edited_image_${j + 1}`] = binaryItem;
                                processedImage.binary_property = `edited_image_${j + 1}`;

                                returnData.push({
                                    json: {
                                        id: response.id,
                                        created: response.created,
                                        model: response.model,
                                        object: response.object,
                                        finish_reason: choice.finish_reason,
                                        usage: response.usage,
                                        images: [processedImage],
                                        total_images: 1,
                                        thinking_blocks: message?.thinking_blocks || [],
                                        vertex_ai_grounding_metadata: response.vertex_ai_grounding_metadata,
                                        vertex_ai_url_context_metadata: response.vertex_ai_url_context_metadata,
                                        vertex_ai_safety_results: response.vertex_ai_safety_results,
                                        vertex_ai_citation_metadata: response.vertex_ai_citation_metadata,
                                        response_type: 'chat/completions',
                                        operation: 'edit'
                                    },
                                    binary: Object.keys(binaryData).length > 0 ? binaryData : undefined,
                                    pairedItem: { item: i }
                                });
                                return;
                            } catch (error) {
                                ctx.logger.error(`Failed to process base64 image from Gemini ${j + 1}: ${error}`);
                                processedImage.error = 'Failed to process base64 image data';
                            }
                        }
                        processedImages.push(processedImage);
                    }
                }

                returnData.push({
                    json: {
                        id: response.id,
                        created: response.created,
                        model: response.model,
                        object: response.object,
                        finish_reason: choice.finish_reason,
                        usage: response.usage,
                        images: processedImages,
                        total_images: processedImages.length,
                        thinking_blocks: message?.thinking_blocks || [],
                        vertex_ai_grounding_metadata: response.vertex_ai_grounding_metadata,
                        vertex_ai_url_context_metadata: response.vertex_ai_url_context_metadata,
                        vertex_ai_safety_results: response.vertex_ai_safety_results,
                        vertex_ai_citation_metadata: response.vertex_ai_citation_metadata,
                        response_type: 'chat/completions',
                        operation: 'edit'
                    },
                    pairedItem: { item: i }
                });
                return;
            } else {
                returnData.push({ json: response, pairedItem: { item: i } });
                return;
            }
        }

        const FormData = require('form-data');
        const multipart = new FormData();
        const size = ctx.getNodeParameter('editSize', i) as string;
        const n = ctx.getNodeParameter('nEdit', i) as number;
        const quality = ctx.getNodeParameter('editQuality', i) as string;

        // Image
        if (inputMode === 'binaryData') {
            const imageBinaryProperty = ctx.getNodeParameter('imageBinaryProperty', i) as string;
            const binaryData = ctx.helpers.assertBinaryData(i, imageBinaryProperty);
            const imageBuffer = await ctx.helpers.getBinaryDataBuffer(i, imageBinaryProperty);
            multipart.append('image', imageBuffer, { filename: binaryData.fileName || 'image.png', contentType: binaryData.mimeType || 'image/png' });
        } else {
            const imageUrl = ctx.getNodeParameter('imageUrl', i) as string;
            if (!imageUrl) throw new NodeOperationError(ctx.getNode(), 'Image URL is required', { itemIndex: i });
            const fileArrayBuffer = await requestWithHandling(ctx, { method: 'GET', url: imageUrl, encoding: 'arraybuffer' } as IHttpRequestOptions);
            const fileBuffer = Buffer.from(fileArrayBuffer as ArrayBuffer);
            multipart.append('image', fileBuffer, { filename: 'image.png', contentType: 'image/png' });
        }

        multipart.append('prompt', prompt);
        multipart.append('model', model);

        if (size) multipart.append('size', size);
        if (n !== undefined) multipart.append('n', String(n));
        if (quality) multipart.append('quality', quality);

        const options = {
            method: 'POST',
            headers: { ...multipart.getHeaders(), 'Authorization': `Bearer ${credentials.apiKey}` },
            body: multipart,
            url: 'https://api.maiarouter.ai/v1/images/edits',
        } as IHttpRequestOptions;
        const response = await requestWithHandling(ctx, options);

        // Handle the response format from images/edits endpoint (same as Generate image)
        if (response && response.data && Array.isArray(response.data)) {
            const processedImages = [];
            const binaryData: IBinaryKeyData = {};

            for (let j = 0; j < response.data.length; j++) {
                const imageData = response.data[j];
                const processedImage: IDataObject = {
                    revised_prompt: imageData.revised_prompt,
                    url: imageData.url
                };

                // Convert base64 to binary data if present
                if (imageData.b64_json && imageData.b64_json.trim() !== '') {
                    try {
                        const imageBuffer = Buffer.from(imageData.b64_json, 'base64');
                        const binaryFileName = `edited-image-${j + 1}.png`;
                        const binaryItem = await ctx.helpers.prepareBinaryData(
                            imageBuffer,
                            binaryFileName,
                            'image/png'
                        );
                        binaryData[`edited_image_${j + 1}`] = binaryItem;
                        processedImage.binary_property = `edited_image_${j + 1}`;
                    } catch (error) {
                        ctx.logger.error(`Failed to process base64 edited image ${j + 1}: ${error}`);
                        processedImage.error = 'Failed to process base64 image data';
                    }
                } else {
                    // Handle case where b64_json is empty or null
                    processedImage.warning = 'No image data returned';
                }

                processedImages.push(processedImage);
            }

            // Prepare the response data
            const responseData: IDataObject = {
                created: response.created,
                background: response.background,
                output_format: response.output_format,
                quality: response.quality,
                size: response.size,
                usage: response.usage,
                images: processedImages,
                total_images: processedImages.length,
                operation: 'edit',
                response_type: 'images/edits'
            };

            returnData.push({
                json: responseData,
                binary: Object.keys(binaryData).length > 0 ? binaryData : undefined,
                pairedItem: { item: i }
            });
        } else {
            // Fallback to raw response if format is unexpected
            returnData.push({ json: response, pairedItem: { item: i } });
        }
        return;
    }
}