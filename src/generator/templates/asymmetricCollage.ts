import { CollageData } from '../../types.js'
import { create } from '../utils/toolbox.js'
import { CollageEntityTypes, drawTile, getImagesBeforehandVariation } from '../utils/collages.js'
import { PAD_SIZE } from '../constants.js'

type Coordinate = [x: number, y: number];
type TileLayout = [coord: Coordinate, size: number];

const GRID_CONFIG = [
    { count: 4, cols: 4, size: 600, padX: PAD_SIZE, padY: PAD_SIZE, startY: PAD_SIZE },
    { count: 12, cols: 6, size: 400, padX: PAD_SIZE - 3, padY: PAD_SIZE, startY: PAD_SIZE * 2 + 600 },
    { count: 24, cols: 8, size: 300, padX: PAD_SIZE - 4.5, padY: PAD_SIZE - 1, startY: (PAD_SIZE - 1) * 4 + 1400 }
];

const generateOrdering = (): TileLayout[] => {
    const ordering: TileLayout[] = [];

    for (const config of GRID_CONFIG) {
        for (let i = 0; i < config.count; i++) {
            const col = i % config.cols;
            const row = Math.floor(i / config.cols);

            const x = config.padX + col * (config.padX + config.size);
            const y = config.startY + row * (config.padY + config.size);

            ordering.push([[x, y], config.size]);
        }
    }

    return ordering;
};

const ORDERING = generateOrdering();

const sanityCheck = (data: CollageData): void => {
    if (!data.username || !data.entity) {
        throw new Error('Missing username or entity');
    }
}

export default async (id: string, data: CollageData): Promise<void> => {
    sanityCheck(data);

    const { ctx, finish } = create(2450, 2360, true);
    
    try {
        const entities = await CollageEntityTypes[data.entity](data.username, 40, data.period);
        await getImagesBeforehandVariation(entities, ORDERING);

        await Promise.allSettled(
            entities.map((tile, index) => {
                const [[x, y], size] = ORDERING[index];
                return drawTile(tile, index, ctx, data, size, [x, y]);
            })
        );

        return finish(id);
    } catch (error) {
        console.error(`Collage generation failed for id: ${id}`, error);
        throw error; 
    }
}