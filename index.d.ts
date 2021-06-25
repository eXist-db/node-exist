// Type definitions for node-exist
// Project: node-exist
// Definitions by: Juri Leino https://line-o.de

import { XMLRPCClient } from "./components/app";

/*~ This is the module template file. You should rename it to index.d.ts
 *~ and place it in a folder with the same name as the module.
 *~ For example, if you were writing a file for "super-greeter", this
 *~ file should be 'super-greeter/index.d.ts'
 */

function getProperty<T, K extends keyof T>(obj: T, key: K) {
    return obj[key];
}

declare namespace NodeExist {
    declare interface ConnectionOptions {
        host?: string; // database host, default: "localhost"
        port?: string; // database port, default: "8443"
        secure?: boolean; // use HTTPS? default: true
        path?: string; // path to XMLRPC, default: "/exist/xmlrpc"
        basic_auth?: {user:string, pass:string}; // database user credentials, default: "guest/guest"
    }
    declare interface Modules {
        client: XMLRPCClient;
        server: BoundModule;
        queries: Object<string, function>;
        resources: Object<string, function>;
        documents: Object<string, function>;
        collections: Object<string, function>;
        indices: Object<string, function>;
        users: Object<string, function>;
        app: app;
    }
    declare interface NormalizedQueryResult {
        success: boolean; // true, if operation succeeded
        result?: any; // detailed information, if the operation succeeded
        error?: Error | {code:string, value:string}; // detailed information, if the operation failed
    }
    declare type ModuleFunction = function(client:)
    declare type BoundModuleFunction = Object<string, BoundModuleFunction>
    declare type Module = Object<string, ModuleFunction>
    declare type BoundModule = Object<string, BoundModuleFunction>
    declare function getMimeType(path: string): string;
    declare function defineMimeTypes(mimetypes: Object<string, Array<string>>): void;
    declare function connect(options: NodeExist.ConnectionOptions): NodeExist.Modules
    declare class app {
        upload: function (xarBuffer: Buffer, xarName: string): Promise<NormalizedQueryResult>;    
        install: function (xarName: string, packageUri: string, customPackageRepoUrl: string): Promise<NormalizedQueryResult>;
        deploy: function (packageUri: string): Promise<NormalizedQueryResult>;
        remove: function (packageUri: string): Promise<NormalizedQueryResult>;
    }
}

export = NodeExist;
/*~ You can declare types that are available via importing the module */
  
/*~ If this module exports functions, declare them like so.
 */
