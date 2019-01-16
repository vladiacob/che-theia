/*********************************************************************
 * Copyright (c) 2018 Red Hat, Inc.
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 **********************************************************************/

import { injectable } from 'inversify';
import { WebSocketOptions } from '@theia/core/lib/browser';
import { JsonRpcProxy, JsonRpcProxyFactory } from '@theia/core/lib/common/messaging/proxy-factory';
import { ConnectionHandler } from '@theia/core/lib/common/messaging';
import { listen as doListen, Logger, ConsoleLogger } from 'vscode-ws-jsonrpc/lib';
const ReconnectingWebSocket = require('reconnecting-websocket');

@injectable()
export class RemoteWebSocketConnectionProvider {

    createProxy<T extends object>(path: string, target?: object): JsonRpcProxy<T> {
        const proxyFactory = new JsonRpcProxyFactory<T>(target);
        this.listen({
            path,
            onConnection: c => proxyFactory.listen(c)
        });
        return proxyFactory.createProxy();
    }

    protected listen(handler: ConnectionHandler, options?: WebSocketOptions): void {
        const webSocket = this.createWebSocket(handler.path);

        const logger = this.createLogger();
        webSocket.onerror = function (error: Event) {
            logger.error('' + error);
            return;
        };
        doListen({
            webSocket,
            onConnection: handler.onConnection.bind(handler),
            logger
        });
    }

    protected createLogger(): Logger {
        return new ConsoleLogger();
    }

    createWebSocket(url: string): WebSocket {
        return new ReconnectingWebSocket(url, undefined, {
            maxReconnectionDelay: 10000,
            minReconnectionDelay: 1000,
            reconnectionDelayGrowFactor: 1.3,
            connectionTimeout: 10000,
            maxRetries: Infinity,
            debug: false
        });
    }
}
