/**
 * DIgServer API
 * API for Ig Receptor gene data
 *
 * OpenAPI spec version: 1.0
 * 
 *
 * NOTE: This class is auto generated by the swagger code generator program.
 * https://github.com/swagger-api/swagger-codegen.git
 * Do not edit the class manually.
 */
/* tslint:disable:no-unused-variable member-ordering */

import { Inject, Injectable, Optional }                      from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams,
         HttpResponse, HttpEvent }                           from '@angular/common/http';
import { CustomHttpUrlEncodingCodec }                        from '../encoder';

import { Observable }                                        from 'rxjs/Observable';


import { BASE_PATH, COLLECTION_FORMATS }                     from '../variables';
import { Configuration }                                     from '../configuration';


@Injectable()
export class RepseqService {

    protected basePath = 'https://localhost/api';
    public defaultHeaders = new HttpHeaders();
    public configuration = new Configuration();

    constructor(protected httpClient: HttpClient, @Optional()@Inject(BASE_PATH) basePath: string, @Optional() configuration: Configuration) {
        if (basePath) {
            this.basePath = basePath;
        }
        if (configuration) {
            this.configuration = configuration;
            this.basePath = basePath || configuration.basePath || this.basePath;
        }
    }

    /**
     * @param consumes string[] mime-types
     * @return true: consumes contains 'multipart/form-data', false: otherwise
     */
    private canConsumeForm(consumes: string[]): boolean {
        const form = 'multipart/form-data';
        for (const consume of consumes) {
            if (form === consume) {
                return true;
            }
        }
        return false;
    }


    /**
     * Returns the list of datasets available for the selected species
     * 
     * @param species 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getDataSetApi(species: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
    public getDataSetApi(species: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public getDataSetApi(species: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public getDataSetApi(species: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

        if (species === null || species === undefined) {
            throw new Error('Required parameter species was null or undefined when calling getDataSetApi.');
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];

        return this.httpClient.get<any>(`${this.basePath}/repseq/ref_seqs/${encodeURIComponent(String(species))}`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Returns information on the selected sample
     * 
     * @param species 
     * @param dataset 
     * @param sample 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getSampleInfoApi(species: string, dataset: string, sample: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
    public getSampleInfoApi(species: string, dataset: string, sample: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public getSampleInfoApi(species: string, dataset: string, sample: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public getSampleInfoApi(species: string, dataset: string, sample: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

        if (species === null || species === undefined) {
            throw new Error('Required parameter species was null or undefined when calling getSampleInfoApi.');
        }

        if (dataset === null || dataset === undefined) {
            throw new Error('Required parameter dataset was null or undefined when calling getSampleInfoApi.');
        }

        if (sample === null || sample === undefined) {
            throw new Error('Required parameter sample was null or undefined when calling getSampleInfoApi.');
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];

        return this.httpClient.get<any>(`${this.basePath}/repseq/sample_info/${encodeURIComponent(String(species))}/${encodeURIComponent(String(dataset))}/${encodeURIComponent(String(sample))}`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Returns the list of samples in the selected dataset
     * 
     * @param species 
     * @param dataset 
     * @param pageNumber 
     * @param pageSize 
     * @param filter 
     * @param sortBy 
     * @param cols 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getSamplesApi(species: string, dataset: string, pageNumber?: number, pageSize?: number, filter?: string, sortBy?: string, cols?: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
    public getSamplesApi(species: string, dataset: string, pageNumber?: number, pageSize?: number, filter?: string, sortBy?: string, cols?: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public getSamplesApi(species: string, dataset: string, pageNumber?: number, pageSize?: number, filter?: string, sortBy?: string, cols?: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public getSamplesApi(species: string, dataset: string, pageNumber?: number, pageSize?: number, filter?: string, sortBy?: string, cols?: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

        if (species === null || species === undefined) {
            throw new Error('Required parameter species was null or undefined when calling getSamplesApi.');
        }

        if (dataset === null || dataset === undefined) {
            throw new Error('Required parameter dataset was null or undefined when calling getSamplesApi.');
        }






        let queryParameters = new HttpParams({encoder: new CustomHttpUrlEncodingCodec()});
        if (pageNumber !== undefined && pageNumber !== null) {
            queryParameters = queryParameters.set('page_number', <any>pageNumber);
        }
        if (pageSize !== undefined && pageSize !== null) {
            queryParameters = queryParameters.set('page_size', <any>pageSize);
        }
        if (filter !== undefined && filter !== null) {
            queryParameters = queryParameters.set('filter', <any>filter);
        }
        if (sortBy !== undefined && sortBy !== null) {
            queryParameters = queryParameters.set('sort_by', <any>sortBy);
        }
        if (cols !== undefined && cols !== null) {
            queryParameters = queryParameters.set('cols', <any>cols);
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];

        return this.httpClient.get<any>(`${this.basePath}/repseq/samples/${encodeURIComponent(String(species))}/${encodeURIComponent(String(dataset))}`,
            {
                params: queryParameters,
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Returns the list of sequences in the selected datasets
     * 
     * @param species 
     * @param dataset 
     * @param pageNumber 
     * @param pageSize 
     * @param filter 
     * @param sortBy 
     * @param cols 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getSequencesApi(species: string, dataset: string, pageNumber?: number, pageSize?: number, filter?: string, sortBy?: string, cols?: string, observe?: 'body', reportProgress?: boolean): Observable<any>;
    public getSequencesApi(species: string, dataset: string, pageNumber?: number, pageSize?: number, filter?: string, sortBy?: string, cols?: string, observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public getSequencesApi(species: string, dataset: string, pageNumber?: number, pageSize?: number, filter?: string, sortBy?: string, cols?: string, observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public getSequencesApi(species: string, dataset: string, pageNumber?: number, pageSize?: number, filter?: string, sortBy?: string, cols?: string, observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

        if (species === null || species === undefined) {
            throw new Error('Required parameter species was null or undefined when calling getSequencesApi.');
        }

        if (dataset === null || dataset === undefined) {
            throw new Error('Required parameter dataset was null or undefined when calling getSequencesApi.');
        }






        let queryParameters = new HttpParams({encoder: new CustomHttpUrlEncodingCodec()});
        if (pageNumber !== undefined && pageNumber !== null) {
            queryParameters = queryParameters.set('page_number', <any>pageNumber);
        }
        if (pageSize !== undefined && pageSize !== null) {
            queryParameters = queryParameters.set('page_size', <any>pageSize);
        }
        if (filter !== undefined && filter !== null) {
            queryParameters = queryParameters.set('filter', <any>filter);
        }
        if (sortBy !== undefined && sortBy !== null) {
            queryParameters = queryParameters.set('sort_by', <any>sortBy);
        }
        if (cols !== undefined && cols !== null) {
            queryParameters = queryParameters.set('cols', <any>cols);
        }

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];

        return this.httpClient.get<any>(`${this.basePath}/repseq/sequences/${encodeURIComponent(String(species))}/${encodeURIComponent(String(dataset))}`,
            {
                params: queryParameters,
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

    /**
     * Returns the list of species for which information is held
     * 
     * @param observe set whether or not to return the data Observable as the body, response or events. defaults to returning the body.
     * @param reportProgress flag to report request and response progress.
     */
    public getSpeciesApi(observe?: 'body', reportProgress?: boolean): Observable<any>;
    public getSpeciesApi(observe?: 'response', reportProgress?: boolean): Observable<HttpResponse<any>>;
    public getSpeciesApi(observe?: 'events', reportProgress?: boolean): Observable<HttpEvent<any>>;
    public getSpeciesApi(observe: any = 'body', reportProgress: boolean = false ): Observable<any> {

        let headers = this.defaultHeaders;

        // to determine the Accept header
        let httpHeaderAccepts: string[] = [
            'application/json'
        ];
        const httpHeaderAcceptSelected: string | undefined = this.configuration.selectHeaderAccept(httpHeaderAccepts);
        if (httpHeaderAcceptSelected != undefined) {
            headers = headers.set('Accept', httpHeaderAcceptSelected);
        }

        // to determine the Content-Type header
        const consumes: string[] = [
            'application/json'
        ];

        return this.httpClient.get<any>(`${this.basePath}/repseq/species`,
            {
                withCredentials: this.configuration.withCredentials,
                headers: headers,
                observe: observe,
                reportProgress: reportProgress
            }
        );
    }

}
