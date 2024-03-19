// Parameters when doing an API request
export type APIQueryParams = Record<string, string | Array<string>> | null;

// Data passed to the API functions when doing a non-GET request
export type APIQueryValue = string | number | boolean | Array<string | number>;
export type APIQueryData = FormData | Record<string, APIQueryValue> | null;

// Tracking info about the last API query performed
export type APILastRequest = {
    url: URL | null,
    method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'None',
    options: RequestInit | undefined
}


export default class RestApi {
    private readonly urlBase: string;
    private readonly urlSuffix: string;
    private lastRequest: APILastRequest;

    constructor(baseUrl: string, urlSuffix: string = "") {
        this.urlBase = baseUrl;
        this.urlSuffix = urlSuffix;
        this.lastRequest = {
            url: null,
            method: "None",
            options: undefined
        };
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Send GET request to API
    async getJson<Type>(urlPath: string = '', queryParams: APIQueryParams = null): Promise<Type> {
        const response = await fetch(this.buildRequestUrl(urlPath, queryParams));
        const result = await response.json();
        if (!response.ok) {
            this.handleResponseErrors(response, result);
        }
        this.lastRequest.method = 'GET';
        this.lastRequest.options = undefined;
        return result as Type;
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Send POST request to API
    async postJson<Type>(urlPath: string = '', formData: APIQueryData = null, queryParams: APIQueryParams = null): Promise<Type> {
        let response = await fetch(this.buildRequestUrl(urlPath, queryParams), this.getFetchOptions("POST", formData ?? {}));
        let result = await response.json();
        if (!response.ok) {
            this.handleResponseErrors(response, result);
        }
        this.lastRequest.method = 'POST';
        return result as Type;
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Send PATCH request to API
    async updateJson<Type>(urlPath: string = '', formData: APIQueryData = null, queryParams: APIQueryParams = null): Promise<Type> {
        let response = await fetch(this.buildRequestUrl(urlPath, queryParams), this.getFetchOptions("PATCH", formData ?? {}));
        let result = await response.json();
        if (!response.ok) {
            this.handleResponseErrors(response, result);
        }
        this.lastRequest.method = 'PATCH';
        return result as Type;
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Send DELETE request to API
    async deleteJson<Type>(urlPath: string = '', formData: APIQueryData = null, queryParams: APIQueryParams = null): Promise<Type> {
        let response = await fetch(this.buildRequestUrl(urlPath, queryParams), this.getFetchOptions("DELETE", formData ?? {}));
        let result = await response.json();
        if (!response.ok) {
            this.handleResponseErrors(response, result);
        }
        this.lastRequest.method = 'DELETE';
        return result as Type;
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Repeat latest request, with optional modifications.
    // If urlPath or queryParams is set they will override that existing value of the last request. 
    async repeatRequestJson<Type>(urlPath: string = '', queryParams: APIQueryParams = null): Promise<Type> {
        const response = await fetch(this.rebuildRequestUrl(urlPath, queryParams), this.lastRequest.options ?? {});
        const result = await response.json();
        if (!response.ok) {
            this.handleResponseErrors(response, result);
        }
        return result as Type;
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Create a json-encoded object from a FormData object
    formdataToJson(formData: FormData): string {
        var dataObject = {};
        if (formData instanceof FormData) {
            formData.forEach((value, key) => {
                // In case the remote api is type sensitive (like Firebase), convert to numbers and booleans from the FormData strings 
                let currValue: APIQueryValue = value as string;
                if (!isNaN(Number(value))) {
                    currValue = Number(value as string);
                }
                else if ((value === "true") || (value === "false")) {
                    currValue = (value === "true");
                }

                // Handle formdata with multiple value fields with the same name attribute (like SELECT tags 
                //  with the "multiple" attribute, checkbox groups etc)
                if (!(key in dataObject)) {
                    dataObject[key] = currValue;
                }
                else {
                    if (!Array.isArray(dataObject[key])) {
                        dataObject[key] = [dataObject[key]];
                    }
                    dataObject[key].push(currValue);
                }
            });
        }
        return JSON.stringify(dataObject);
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Assemble URL to send requests to.
    private buildRequestUrl(urlPath: string = '', queryParams: APIQueryParams = null): URL {
        const url: URL = new URL(`${this.urlBase}${urlPath.length ? "/" + urlPath : ""}${this.urlSuffix}`);
        if (queryParams && (Object.keys(queryParams).length > 0)) {
            for (const key in queryParams) {
                if (Array.isArray(queryParams[key])) {
                    for (const elem of queryParams[key]) {
                        url.searchParams.append(key, elem);
                    }
                }
                else {
                    url.searchParams.append(key, queryParams[key] as string);
                }
            }
        }
        this.lastRequest.url = url;
        return url;
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Get and update last requested URL. 
    private rebuildRequestUrl(urlPath: string = '', queryParams: APIQueryParams = null): URL {
        if (!this.lastRequest.url) {
            this.lastRequest.url = this.buildRequestUrl(urlPath, queryParams);
        }
        else {
            if (urlPath.length > 0) {
                this.lastRequest.url.pathname = `/${urlPath}${this.urlSuffix}`;
            }

            // Set additional query params, or override existing with same name. 
            if (queryParams && (Object.keys(queryParams).length > 0)) {
                for (const key in queryParams) {
                    if (Array.isArray(queryParams[key]) && (queryParams[key].length > 0)) {
                        this.lastRequest.url.searchParams.set(key, queryParams[key][0]);

                        for (let i = 1; i < queryParams[key].length; i++) {
                            this.lastRequest.url.searchParams.append(key, queryParams[key][i]);
                        }
                    }
                    else {
                        this.lastRequest.url.searchParams.set(key, queryParams[key] as string);
                    }
                }
            }
        }
        return this.lastRequest.url;
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Build options object for fetch() for submitting JSON data.
    private getFetchOptions(reqMethod: string, formData: APIQueryData): RequestInit {
        const options: RequestInit = {
            method: reqMethod,
            headers: { "Content-Type": "application/json" },
            body: (formData instanceof FormData ? this.formdataToJson(formData) : JSON.stringify(formData)),
        };
        this.lastRequest.options = options;
        return options;
    }


    //////////////////////////////////////////////////////////////////////////////////////////////////////
    // Handle error responses from the API requests
    private handleResponseErrors(response: Response, result: any): void {
        this.lastRequest.url = null;
        this.lastRequest.method = "None";
        this.lastRequest.options = undefined;

        if ((response.status == 400)) {
            throw new ApiError(response.status, `Bad request: ${result.error ?? ""}  (${response.statusText})`);
        }
        // Server errors - show the error message from API
        else if (response.status == 500) {
            throw new ApiError(response.status, `Server error: ${result.error ?? ""}  (${response.statusText})`);
        }
        // Other errors - show request status message
        else {
            throw new ApiError(response.status, `API Error: ${response.statusText}`);
        }
    }
}


// Exception class for keeping response/error codes separate from the message text.
export class ApiError extends Error {
    public readonly errorCode: number;

    constructor(errorCode: number, errorMessage: string) {
        super(errorMessage);
        this.errorCode = errorCode;
    }
}