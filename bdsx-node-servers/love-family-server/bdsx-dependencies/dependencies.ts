import { command, createPacket, netevent, NetworkIdentifier, PacketId, sendPacket } from "bdsx";
import { CommandServiceDependencyType, createCommandService } from "../src/tools/commandService";
import { createFormsApi, FormsApiDependenciesType } from "../src/tools/formsApi";
import { ConnectionsTrackingServiceDependencies, ConnectionsTrackingServiceType, createConnectionsTrackingService } from "../src/tools/playerConnections";
import { ServicesType } from "../src/tools/services";
import { NetworkIdentifier as NetworkIdentifierAlias } from "../src/types";

const getNetworkIdentifier = (networkIdentifier: NetworkIdentifierAlias) => networkIdentifier as unknown as NetworkIdentifier;
const getNetworkIdentifierAlias = (networkIdentifier: NetworkIdentifier) => networkIdentifier as unknown as NetworkIdentifierAlias;

export const createFormsApiDependencies = (): FormsApiDependenciesType => {
    return {
        sendForm: ({ formId, content, networkIdentifier }) => {
            let packet = createPacket(PacketId.ModalFormRequest);
            packet.setUint32(formId, 0x28);
            packet.setCxxString(content, 0x30);
            sendPacket(getNetworkIdentifier(networkIdentifier), packet);
            packet.dispose();
        },
        onFormResponse: (callback) => {
            netevent.raw(PacketId.ModalFormResponse).on((ptr, _size, networkIdentifier, packetId) => {
                ptr.move(1);
                const formId = ptr.readVarUint();
                const rawData = ptr.readVarString();
                callback({ formId, rawData, networkIdentifier: getNetworkIdentifierAlias(networkIdentifier) });
            });
        },
    };
};

export const createConnectionsTrackingServiceDependencies = (): ConnectionsTrackingServiceDependencies => {
    return {
        onLogin: (callback) => {
            netevent.after(PacketId.Login).on((ptr, networkIdentifier, packetId) => {
                const [xuid, username] = netevent.readLoginPacket(ptr);
                callback({
                    networkIdentifier: getNetworkIdentifierAlias(networkIdentifier),
                    xuid,
                    username,
                });
            });
        },
        onClose: (callback) => {
            netevent.close.on((networkIdentifier) => {
                callback({ networkIdentifier: getNetworkIdentifierAlias(networkIdentifier) });
            });
        },
    };
};

export const createCommandServiceDependencies = (connectionsTracking: ConnectionsTrackingServiceType): CommandServiceDependencyType => {

    return {
        onPlayerCommand: (callback) => {
            command.hook.on((cmd, originName) => {
                const { networkIdentifier } = connectionsTracking.getPlayerConnections().find(x => x.playerName === originName) ?? {};
                if (!networkIdentifier) { return; }

                callback({ command: cmd, networkIdentifier: networkIdentifier });
            });
        },
        onServerCommand: (callback) => {
            command.hook.on((cmd, originName) => {
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