import { Entity } from "../../fm/types.js"
import { extractIDFromURL, getImage } from "../../imaging.js"
import { downloadImages, downloadImagesWithObjects } from "../../pool/pool.js"
import { getTopAlbums, getTopArtists, getTopTracks } from "../../fm/index.js"
import { CollageData } from "../../types.js"
import { COLLAGE_TILE_SIZE, PAD_SIZE } from "../constants.js"
import { loadImage, SKRSContext2D } from "@napi-rs/canvas"
import { debug } from "../../logging.js"
import { createShadowGradient, font } from "./toolbox.js"

export interface CollageTile {
    image: string;
    name: string;
    sub: string | undefined;
}

export const getImagesBeforehand = async (
    entities: Entity[],
    dimensions: number = 300,
): Promise<void> => {
    await downloadImages(
        entities.map((z) => extractIDFromURL(z.imageURL)!),
        dimensions,
    )
}

export const getImagesBeforehandVariation = async (
    entities: Entity[],
    position: [unknown, number][],
): Promise<void> => {
    await downloadImagesWithObjects(
        entities.map((z, i) => {
            return {
                id: extractIDFromURL(z.imageURL)!,
                size: position[i][1],
            }
        }),
    )
}

export const CollageEntityTypes = {
    artist: getTopArtists,
    album: getTopAlbums,
    track: getTopTracks,
}

const determineTilePosition = (
    index: number,
    { columns, rows, padded }: CollageData,
): [number, number] => {
    let row = 0,
        column = 0
    while (index > 0) {
        row++
        if (row === rows) {
            row = 0
            column++
        }
        index--
    }

    const horizontalPadding = padded ? (row + 1) * PAD_SIZE : 0
    const verticalPadding = padded ? (column + 1) * PAD_SIZE : 0
    return [
        row * COLLAGE_TILE_SIZE + horizontalPadding,
        column * COLLAGE_TILE_SIZE + verticalPadding,
    ]
}

export const drawTile = async (
    tile: Entity,
    index: number,
    ctx: SKRSContext2D,
    data: CollageData,
    size: number = COLLAGE_TILE_SIZE,
    position?: [number, number],
) => {
    const [x, y] = position ?? determineTilePosition(index, data);
    debug(
        "classicCollage.drawTile",
        `drawing tile for ${tile.name} at (${x}, ${y})`,
    );
    
    const buffer = await getImage(extractIDFromURL(tile.imageURL)!, size);
    const image = await loadImage(buffer);

    let sx = 0;
    let sy = 0;
    let sSize = image.width;

    if (image.width > image.height) {
        sSize = image.height;
        sx = (image.width - sSize) / 2;
    } else if (image.height > image.width) {
        sSize = image.width;
        sy = (image.height - sSize) / 2;
    }
    
    ctx.drawImage(image, sx, sy, sSize, sSize, x, y, size, size);

    if (data.show_labels) {
        createShadowGradient(ctx, x, y, size, size * 0.3);
        ctx.fillStyle = "white";

        const maxWidth = size - 10;
        let fontSize = 20;
        let text = tile.name;

        ctx.font = font("Inter Semi Bold", fontSize);

        while (fontSize > 16 && ctx.measureText(text).width > maxWidth) {
            fontSize -= 1;
            ctx.font = font("Inter Semi Bold", fontSize);
        }

        if (ctx.measureText(text).width > maxWidth) {
            let truncated = text;
            while (truncated.length > 0 && ctx.measureText(truncated + "...").width > maxWidth) {
                truncated = truncated.slice(0, -1);
            }
            text = truncated + "...";
        }

        const textY = y + fontSize + 5;
        ctx.fillText(text, x + 5, textY);

        if (data.show_play_count !== false) {
            ctx.font = font("Plex Sans Regular", 18);
            const suffix = tile.playcount === 1 ? "" : "s";
            ctx.fillText(`${tile.playcount} scrobble${suffix}`, x + 5, textY + 24);
        }
    }
}