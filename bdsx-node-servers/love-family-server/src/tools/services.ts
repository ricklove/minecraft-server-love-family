import { CommandServiceType } from "./commandService";
import { FormsApiType } from "./formsApi";
import { ConnectionsTrackingServiceType } from "./playerConnections";

export type ServicesType = {
    formsService: FormsApiType,
    connectionsService: ConnectionsTrackingServiceType,
    commandService: CommandServiceType,
};