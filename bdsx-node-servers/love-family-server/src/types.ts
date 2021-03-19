
// export { NetworkIdentifier } from "bdsx";
export type NetworkIdentifier = {
    __type: 'NetworkIdentifier';
    getAddress: () => string;
    getActor: () => Actor;
};

export type Actor = {
    isPlayer: () => boolean;
    getEntity: () => IEntity;
};



