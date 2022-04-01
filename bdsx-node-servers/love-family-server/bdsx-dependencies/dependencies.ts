import { command } from "bdsx/command";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { events } from "bdsx/event";
import { ModalFormRequestPacket } from "bdsx/bds/packets";
import { CommandServiceDependencyType, createCommandService } from "../src/tools/commandService";
import { createFormsApi, FormsApiDependenciesType } from "../src/tools/formsApi";
import { ConnectionsTrackingServiceDependencies, ConnectionsTrackingServiceType, createConnectionsTrackingService } from "../src/tools/playerConnections";
import { ServicesType } from "../src/tools/services";
import { NetworkIdentifier as NetworkIdentifierAlias } from "../src/types";
import { MinecraftPacketIds } from "bdsx/bds/packetids";

const getNetworkIdentifier = (networkIdentifier: NetworkIdentifierAlias) => networkIdentifier as unknown as NetworkIdentifier;
const getNetworkIdentifierAlias = (networkIdentifier: NetworkIdentifier) => networkIdentifier as unknown as NetworkIdentifierAlias;

export const createFormsApiDependencies = (): FormsApiDependenciesType => {
    return {
        sendForm: ({ formId, content, networkIdentifier }) => {
            const packet = ModalFormRequestPacket.allocate();
            packet.id = formId;
            packet.content = content;
            packet.sendTo(getNetworkIdentifier(networkIdentifier), 0);
            packet.dispose();
        },
        onFormResponse: (callback) => {
            events.packetAfter(MinecraftPacketIds.ModalFormResponse).on((packet, networkIdentifier) => {
                try {
                    callback({ formId: packet.id, rawData: packet.response, networkIdentifier: getNetworkIdentifierAlias(networkIdentifier) });
                } catch (err) {
                    // Ignore
                }
            });
        },
    };
};

export const createConnectionsTrackingServiceDependencies = (): ConnectionsTrackingServiceDependencies => {
    return {
        onLogin: (callback) => {
            events.packetAfter(MinecraftPacketIds.Login).on((ptr, networkIdentifier, packetId) => {
                if(!ptr.connreq){ return; }
                callback({
                    networkIdentifier: getNetworkIdentifierAlias(networkIdentifier),
                    xuid: ptr.connreq.cert.getXuid(),
                    username: ptr.connreq.cert.getIdentityName(),
                });
            });
        },
        onClose: (callback) => {
            events.networkDisconnected.on((networkIdentifier) => {
                callback({ networkIdentifier: getNetworkIdentifierAlias(networkIdentifier) });
            });
        },
    };
};

export const createCommandServiceDependencies = (connectionsTracking: ConnectionsTrackingServiceType): CommandServiceDependencyType => {

    return {
        onPlayerCommand: (callback) => {
            events.command.on((cmd, originName) => {
                const { networkIdentifier } = connectionsTracking.getPlayerConnections().find(x => x.playerName === originName) ?? {};
                if (!networkIdentifier) { return; }

                callback({ command: cmd, networkIdentifier: networkIdentifier });
            });
        },
        onServerCommand: (callback) => {
            events.command.on((cmd, originName) => {
                if (originName !== 'server') { return; }

                callback({ command: cmd });
            });
        },
    };
};

export const createServices = (): ServicesType => {

    const formsService = createFormsApi(createFormsApiDependencies());
    const connectionsService = createConnectionsTrackingService(createConnectionsTrackingServiceDependencies());
    const commandService = createCommandService(createCommandServiceDependencies(connectionsService));

    return {
        formsService,
        connectionsService,
        commandService,
    };
};