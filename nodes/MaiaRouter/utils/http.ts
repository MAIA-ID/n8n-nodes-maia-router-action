import { IExecuteFunctions, IHttpRequestOptions } from 'n8n-workflow';

export async function requestWithHandling(ctx: IExecuteFunctions, options: IHttpRequestOptions): Promise<any> {
    try {
        return await ctx.helpers.httpRequest(options as IHttpRequestOptions);
    } catch (error) {
        if (typeof error === 'object' && error !== null && 'response' in error) {
            const err = error as any;
            const axiosResponse = err.response;
            ctx.logger.error('API error response: ' + JSON.stringify(axiosResponse?.data ?? axiosResponse));
            err.message = 'Error: ' + (axiosResponse?.data?.error?.message || err.message);
        } else if (typeof error === 'object' && error !== null) {
            const err = error as Error;
            err.message = 'Error: ' + err.message;
            ctx.logger.error('error: ' + JSON.stringify(error));
        } else {
            ctx.logger.error('Unknown error: ' + String(error));
        }
        throw error;
    }
}



