import { Vector3 } from "../utils/vector";

type EntityInfo = {
    id: string,
    type: string,
    pos: Vector3,
};

const getEntityPositions = (system: IVanillaServerSystem) => {
    const allEntitiesQuery = system.registerQuery();
    if (!allEntitiesQuery) { return; }
    const allEntities = system.getEntitiesFromQuery(allEntitiesQuery);


    const data = allEntities
        .map(x => {
            const pos = system.getComponent(x, MinecraftComponent.Position);
            if (!pos) { return; }

            return {
                id: x.__unique_id__["64bit_high"] + ':' + x.__unique_id__["64bit_low"],
                type: x.__identifier__,
                pos: pos.data
            };
        }).filter(x => x).map(x => x!);

    const chunks = [] as { key: string, chunkPos: Vector3, entities: EntityInfo[] }[];
    data.forEach(x => {
        const cx = Math.floor(x.pos.x / 16);
        const cy = 0;
        const cz = Math.floor(x.pos.z / 16);
        const chunk = chunks.find(x => x.chunkPos.x === cx && x.chunkPos.y === cy && x.chunkPos.z === cz) ?? (() => {
            const newChunk = {
                key: cx + ',' + cz,
                chunkPos: { x: cx, y: cy, z: cz },
                entities: []
            };
            chunks.push(newChunk);
            return newChunk;
        })();

        chunk.entities.push(x);
    });

    chunks.sort((a, b) => a.chunkPos.x === b.chunkPos.x ? a.chunkPos.y - b.chunkPos.y : a.chunkPos.x - b.chunkPos.x);


    const chunkRect = {
        xMin: chunks.reduce((out, v) => out < v.chunkPos.x ? out : v.chunkPos.x, 1000000),
        xMax: chunks.reduce((out, v) => out > v.chunkPos.x ? out : v.chunkPos.x, -1000000),
        zMin: chunks.reduce((out, v) => out < v.chunkPos.z ? out : v.chunkPos.z, 1000000),
        zMax: chunks.reduce((out, v) => out > v.chunkPos.z ? out : v.chunkPos.z, -1000000),
    };

    return {
        data,
        chunks,
        chunkRect,
    };
};

type EntityPositionData = NonNullable<ReturnType<typeof getEntityPositions>>;

export const getEntityDiff = (a: EntityPositionData, b: EntityPositionData): (EntityPositionData['chunks'][number] & {
    entities_added: EntityInfo[],
    entities_removed: EntityInfo[],
    entities_same: EntityInfo[],
})[] => {

    const allKeys = [...a?.chunks ?? [], ...b?.chunks ?? []].map(x => x.key);
    const chunkDiffs = allKeys.map(k => {
        const aChunk = a?.chunks.find(x => x.key === k);
        const bChunk = b?.chunks.find(x => x.key === k);
        if (!aChunk && !bChunk) {
            return null;
        }
        if (!aChunk) {
            return { ...bChunk!, entities: [], entities_added: bChunk!.entities, entities_removed: [], entities_same: [], };
        }
        if (!bChunk) {
            return { ...aChunk!, pos: aChunk.chunkPos, entities: [], entities_added: [], entities_removed: aChunk.entities, entities_same: [], };
        }

        const removedEntities = [] as typeof aChunk.entities;
        const addedEntities = [] as typeof aChunk.entities;
        const sameEntities = [] as typeof aChunk.entities;

        [...aChunk.entities, ...bChunk.entities].forEach(e => {
            const aEntity = aChunk.entities.find(x => x.id === e.id);
            const bEntity = bChunk.entities.find(x => x.id === e.id);
            if (aEntity && bEntity) {
                sameEntities.push(bEntity);
            }
            if (aEntity) {
                removedEntities.push(aEntity);
            }
            if (bEntity) {
                addedEntities.push(bEntity);
            }
        });

        return {
            ...bChunk,
            entities_added: addedEntities,
            entities_removed: removedEntities,
            entities_same: sameEntities,
        };

    }).filter(x => x).map(x => x!);

    return chunkDiffs;
};

const state = {
    lastEntityPositionData: null as null | EntityPositionData,
};
export const showEntityDiffReport = (system: IVanillaServerSystem) => {
    const newPositions = getEntityPositions(system);
    if (!newPositions) {
        return;
    }

    const oldPositions = state.lastEntityPositionData;
    state.lastEntityPositionData = newPositions;

    if (!oldPositions) {
        return;
    }

    const diff = getEntityDiff(oldPositions, newPositions);
    if (!diff) { return; }

    drawChunkMap({ chunks: diff, chunkRect: newPositions.chunkRect }, c => c.entities_added.filter(x => x.pos.y >= 60));
    drawChunkMap({ chunks: diff, chunkRect: newPositions.chunkRect }, c => c.entities_added.filter(x => x.pos.y < 60 && x.pos.y >= 30));
    drawChunkMap({ chunks: diff, chunkRect: newPositions.chunkRect }, c => c.entities_added.filter(x => x.pos.y < 30));
};


const drawChunkMap = <T extends { chunks: EntityPositionData['chunks'], chunkRect: EntityPositionData['chunkRect'] }>(data: T, getEntities: (chunk: T['chunks'][number]) => EntityInfo[]) => {
    const {
        chunks,
        chunkRect,
    } = data;

    const chunkMap = ''
        + ' ' + [...new Array(chunkRect.xMax - chunkRect.xMin + 1)].map((x, i) => (chunks.some(c => c.chunkPos.x === chunkRect.xMin + i && c.entities.some(e => e.type.includes('player'))) ? '*' : '|')).join('') + ' '
        + '\n'
        + [...new Array(chunkRect.zMax - chunkRect.zMin + 1)].map((y, j) =>
            (chunks.some(c => c.chunkPos.z === chunkRect.zMin + j && c.entities.some(e => e.type.includes('player'))) ? '*' : '|')
            + [...new Array(chunkRect.xMax - chunkRect.xMin + 1)].map((x, i) => {
                const c = chunks.find(c => c.chunkPos.x === chunkRect.xMin + i && c.chunkPos.z === chunkRect.zMin + j);
                if (!c) { return '.'; }
                const cEntities = getEntities(c);
                if (cEntities.length <= 0) { return '.'; }

                // if (cEntities.some(x => x.type.includes('player'))) { return '*'; }

                if (cEntities.length <= 9) { return cEntities.length + ''; }
                return '+';
            }).join('')
            + (chunks.some(c => c.chunkPos.z === chunkRect.zMin + j && c.entities.some(e => e.type.includes('player'))) ? '*' : '|')
        ).join('\n')
        + '\n'
        + ' ' + [...new Array(chunkRect.xMax - chunkRect.xMin + 1)].map((x, i) => (chunks.some(c => c.chunkPos.x === chunkRect.xMin + i && c.entities.some(e => e.type.includes('player'))) ? '*' : '|')).join('') + ' '
        ;
    return chunkMap;
};

export const showEntityPositionReport = (system: IVanillaServerSystem) => {

    const result = getEntityPositions(system);
    if (!result) { return; }

    const chunkMapA = drawChunkMap(result, c => c.entities.filter(x => x.pos.y >= 60));
    const chunkMapB = drawChunkMap(result, c => c.entities.filter(x => x.pos.y < 60 && x.pos.y >= 30));
    const chunkMapC = drawChunkMap(result, c => c.entities.filter(x => x.pos.y < 30));

    const posToString = (pos: Vector3) => { return `(${pos.x.toFixed(0)},${pos.y.toFixed(0)},${pos.z.toFixed(0)})`; };

    const report = ''
        + result.chunks
            .map(c => {
                return `(${posToString(c.chunkPos)}):\n${c.entities.map(x => `    ${posToString(x.pos)}: ${x.type}`).join('\n')}`;
            })
            .join('\n')
        + '\n\n' + chunkMapA
        + '\n\n' + chunkMapB
        + '\n\n' + chunkMapC
        ;

    console.log(report);
};
