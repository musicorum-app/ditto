import { colorVariation, create } from '../utils/toolbox.js'
import { SKRSContext2D,  } from '@napi-rs/canvas'

export interface ChartData {
  type: 'artist' | 'track' | 'album'
  entries: {
    name: string
    photoURL: string
    score: number
    comparison: 'fell' | 'rose' | 'stayed' | 'new'
    peak?: number
    lastWeek?: number
  }[]
}

const TypeDefs = {
  artist: {
    title: ['ARTIST', 'CHART'],
    // darker pink
    color: '#E75480',
  }
}

const generateGradients = (ctx: SKRSContext2D, color: string) => {
  const lighter = colorVariation(color, 40)
  const darker = colorVariation(color, 20)

  // gennrates a circle gradient from the center to the edges. centralized
  const radius = 800
  const x = MAX_WIDTH / 2
  const y = 630
  const extraX = 60
  const gradient = ctx.createRadialGradient(x - extraX, y, 0, x + extraX, y, radius)
  gradient.addColorStop(1, '#f0f0f0')
  gradient.addColorStop(0., lighter)
  gradient.addColorStop(0, darker)
  ctx.fillStyle = gradient
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2)
}

const generateBottomGradient = (ctx: SKRSContext2D, color: string) => {
  // generates a small gradient that goes from the color to a lighter version of it at the end of the canvas
  const gradient = ctx.createLinearGradient(0, 800, 0, 1800)
  const baseColor = colorVariation(color, 50)
  gradient.addColorStop(0, '#f0f0f0')
  gradient.addColorStop(0.9, colorVariation(baseColor, 20))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 800, MAX_WIDTH, 1000)
}

const MAX_WIDTH = 3000
const MAX_HEIGHT = 1800

/*
import { SKRSContext2D } from "@napi-rs/canvas"
import {
    create,
    drawGradientRectangle,
    loadImage,
    drawCircleImage,
    colorVariation,
    drawRoundedRectangle,
    contrastColor,
    writeTextConsideringWidth,
    writeTextCentralizedConsidering,
    drawTextShadow,
    readableNumber,
    drawTextWrapped,
    drawGridOverlay
} from "../utils/toolbox.js"
import { GenerateData } from "../../types.js"

export interface ProfileData {
    confidential?: void
    favoriteCardImageURL: string
    favoriteCardName: string
    favoriteCardRarity: string
    favoriteCardColor?: string
    favoriteCardEmoji?: string
    favoriteCardDisableEmojis?: boolean
    favoriteColor: string
    reputation: number
    username: string
    avatarURL: string
    bio: string
    position: number
    totalCards: number
    badgeEmojis: string[]
    stickerURL: string | null
    backgroundURL: string
    coins: number
}

export const width = 1200
export const height = 800

export default async (
    ctx: SKRSContext2D,
    data: ProfileData,
    gen: GenerateData
): Promise<void> => {
    // DRAW LAYER 1
    await layer1(ctx, data)
    // DRAW LAYER 2
    await layer2(ctx, data)
    // DRAW LAYER 3
    data.favoriteCardImageURL ? await layer3(ctx, data) : await layer3Fallback(ctx, data)
    // DRAw LAYER 4
    data.badgeEmojis?.[0] && await layer4(ctx, data)
    // DRAW LAYER 5
    data.stickerURL && await layer5(ctx, data)
    // DRAW LAYER 6
    await layer6(ctx, data)

    // DRAW THE CONFIDENTIALITY OVERLAY
    if (gen.applyConfidentialyOverlay) await confidentialityOverlay(ctx)
    if (gen.applyGrid) await drawGridOverlay(ctx, 1200, 800, 20)
    if (gen.applyPreviewOverlay) await previewOverlay(ctx)
}

const layer1 = async (ctx: SKRSContext2D, data: ProfileData) => {
    // DRAW VERTICAL LINE ON THE LEFT WITH 50PX USING THE FAV COLOR
    ctx.fillStyle = data.favoriteColor
    drawGradientRectangle(ctx, 0, 0, 160, 800, data.favoriteColor)
    // WRITE THE USER POSITION
    ctx.fillStyle = contrastColor(data.favoriteColor)
    const posSize = ctx.measureText('#' + data.position.toString())
    ctx.font = '30px Inter Light'
    // center the texts
    ctx.fillText('TOP', 60 - posSize.width / 2, 100)
    ctx.font = '50px Montserrat Bold'
    ctx.fillText('#' + data.position.toString(), 60 - posSize.width / 2, 150)
    // DRAW THE BACKGROUND IMAGE
    const bg = await loadImage(data.backgroundURL.replace('/ar_3:4,c_crop/', '/'), 1200 - 160, 350)
    ctx.drawImage(bg, 160, 0)
    // DRAW A WHITE RECTANGLE ON THE BOTTOM W A GRADIENT TOWARDS A VERY LIGHT VERSION OF THE FAV COLOR
    drawGradientRectangle(ctx, 160, 350, 1040, 800 - 350, colorVariation(data.favoriteColor, 20))
    // DRAW SQUARED RECTANGLE FOR STICKER
    ctx.fillStyle = colorVariation(data.favoriteColor, -50)
    drawRoundedRectangle(ctx, 790, 450, 300, 230, 50)
    //ctx.fill()
}

const layer2 = async (ctx: SKRSContext2D, data: ProfileData) => {
    const colorVal = colorVariation(data.favoriteColor, -50)
    // DRAW A LIGHTER VERSION OF THE ROUNDED RECTANGLE A LITTLE BIT UNDERNEATH THE FIRST ONE FOR THE BIO
    const lVal = colorVariation(colorVal, 30)
    ctx.fillStyle = lVal
    drawRoundedRectangle(ctx, 160, 350, 1000, 80, 25)
    ctx.fill()

    // DRAW THE ROUNDED RECTANGLE USING A DARKER VERSION OF THE FAV COLOR
    ctx.fillStyle = colorVal
    drawRoundedRectangle(ctx, 160, 280, 900, 75, 25)
    ctx.fill()

    // WRITE THE USERNAME
    ctx.fillStyle = contrastColor(colorVal)
    ctx.font = '50px Montserrat Bold, Noto Current, Apple Color Emoji'
    writeTextConsideringWidth(ctx, data.username, 380, 335, 700)

    // WRITE THE BIO
    ctx.fillStyle = contrastColor(colorVal)
    ctx.font = '28px Poppins Medium, Noto Current, Apple Color Emoji'
    // put those fancy quotes around the bio
    const bio = `“${data.bio}”`
    writeTextConsideringWidth(ctx, bio, 378, 400, 760)

    // DRAW THE AVATAR
    const avatar = await loadImage(data.avatarURL, 300, 300)
    drawCircleImage(ctx, avatar, 90, 200, 135)

}

const layer3 = async (ctx: SKRSContext2D, data: ProfileData) => {
    // DRAW THE FAVORITE CARD IMAGE
    const favCard = await loadImage(data.favoriteCardImageURL, Math.ceil(230 * 1.15), Math.ceil(345 * 1.15))
    // DRAW A RECTANGLE TO PUT THE CARD IMAGE. IT IS ROUNDED, AND HAS A GRADIENT. THE COLOR DEPENDS ON THE RARITY. Common MEANS ORANGE, RARE MEANS BLUE, LEGENDARY MEANS YELLOW
    let color
    switch (data.favoriteCardRarity) {
        case 'Common':
            // orange color, turning to brown
            color = '#FFA500'
            break
        case 'Rare':
            // silver color
            color = '#C0C0C0'
            break
        case 'Legendary':
            // gold color
            color = '#FFD700'
            break
        default:
            color = '#000000'
    }

    if (data.favoriteCardColor) {
        color = data.favoriteCardColor
    }

    // MAKE GRADIENT FROM COLOR -> DARKER VERSION

    // THE RECT HAS TO BE ROTATED TOO, JUST LIKE THE CARD
    ctx.save()
    ctx.translate(160, 350)
    ctx.rotate(0.1)
    drawGradientRectangle(ctx, -50, 155, 250, 345, color, 25)
    ctx.fill()
    ctx.restore()
    // GET A HEART W THE COLOR AND A MEDAL EMOJI
    let emojis: [string, string]
    switch (data.favoriteCardRarity) {
        case 'Common':
            emojis = ['🧡', '🥉']
            break
        case 'Rare':
            emojis = ['💙', '🥈']
            break
        case 'Legendary':
            emojis = ['💛', '🏅']
            break
        default:
            emojis = ['❤️', '🏅']
    }

    if (data.favoriteCardEmoji) {
        emojis[0] = data.favoriteCardEmoji
    }

    // DRAW THE RECTANGLE FOR WRITING THE FAV CARD NAME
    ctx.fillStyle = colorVariation(data.favoriteColor, -50)
    drawRoundedRectangle(ctx, 260, 700, 380, 70, 25)
    ctx.fill()

    // draw the card rotated
    ctx.save()
    ctx.translate(160, 350)
    ctx.rotate(0.1)
    // round the corners
    ctx.beginPath()
    ctx.moveTo(-90, 170)
    ctx.arcTo(160, 170, 160, 515, 25)
    ctx.arcTo(160, 515, -90, 515, 25)
    ctx.arcTo(-90, 515, -90, 170, 25)
    ctx.arcTo(-90, 170, 160, 170, 25)
    ctx.closePath()
    ctx.clip()
    ctx.drawImage(favCard, -90, 170)
    ctx.restore()
    ctx.restore()
    // DRAW THE EMOJIS. HEART GOES ON LOWER RIGHT, MEDAL ON TOP LEFT
    // THEY ARE SLIGHTLY ROTATED

    if (!data.favoriteCardDisableEmojis) {
        ctx.save()
        ctx.translate(160, 350)
        ctx.rotate(0.13)
        ctx.font = '70px Apple Color Emoji'
        ctx.fillStyle = '#000'
        ctx.fillText(emojis[0], 75, 420)
        ctx.restore()

        ctx.save()
        ctx.translate(160, 350)
        ctx.rotate(0.12)
        ctx.font = '80px Apple Color Emoji'
        ctx.fillStyle = '#000'
        ctx.fillText(emojis[1], -100, 248)
        ctx.restore()
    }

    // WRITE THE FAV CARD NAME
    ctx.fillStyle = contrastColor(colorVariation(data.favoriteColor, -50))
    ctx.font = '30px Poppins Semi Bold, Noto Current, Apple Color Emoji'
    writeTextConsideringWidth(ctx, data.favoriteCardName.toUpperCase(), 295, 745, 300)
}

const layer3Fallback = async (ctx: SKRSContext2D, data: ProfileData) => {
    // draw the name container
    ctx.fillStyle = colorVariation(data.favoriteColor, -50)
    drawRoundedRectangle(ctx, 260, 700, 380, 70, 25)
    ctx.fill()

    // draw the card without the image, meaning, draw the rotaded rectangle, the emojis and the name
    // the color is the -50 variation of the fav color
    ctx.save()
    ctx.fillStyle = colorVariation(data.favoriteColor, -45)
    ctx.translate(160, 350)
    ctx.rotate(0.1)
    drawRoundedRectangle(ctx, -50, 155, 250, 345, 25)
    ctx.fill()
    ctx.restore()

    // draw warning
    // draw warning tecntabgle trsnapant
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    drawRoundedRectangle(ctx, 20, 660, 200, 120, 25)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.font = '20px Montserrat Bold'
    drawTextWrapped(ctx, 'Defina uma carta favorita usando /fav', 30, 700, 200, 25)
}

const layer4 = async (ctx: SKRSContext2D, data: ProfileData) => {
    // DRAW THE BADGES
    // DRAW THE BADGE CONTAINER
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    drawRoundedRectangle(ctx, 680, 20, 470, 60, 25)
    ctx.fill()
    // DRAW THE BADGES
    ctx.font = '35px Apple Color Emoji'
    ctx.fillStyle = '#000'
    let x = 700
    for (const emoji of data.badgeEmojis) {
        ctx.fillText(emoji, x, 60)
        x += 65
    }
}

const layer5 = async (ctx: SKRSContext2D, data: ProfileData) => {
    const sticker = await loadImage(data.stickerURL!, 300, 300)
    // draw image slightly rotated at ctx.drawImage(sticker, 870, 200)
    ctx.save()
    ctx.translate(870, 150)
    ctx.rotate(-0.1)
    ctx.drawImage(sticker, 0, 0)
    ctx.restore()
}

// LAYER FOR DRAWING TOTAL CARDS, COINS
const layer6 = async (ctx: SKRSContext2D, data: ProfileData) => {
    // DRAW THE TOTAL CARDS
    ctx.fillStyle = colorVariation(data.favoriteColor, -50)
    drawRoundedRectangle(ctx, 850, 590, 300, 70, 25)
    ctx.fill()

    // DRAW THE TOTAL CARDS TEXT
    ctx.fillStyle = contrastColor(colorVariation(data.favoriteColor, -50))
    ctx.font = '35px Montserrat Bold'
    writeTextCentralizedConsidering(ctx, `${data.totalCards}`, 860, 640, 280)
    // DRAW CARDS EMOIJI (3 emojis) ROTATED ABOVE THE TEXT
    ctx.save()
    ctx.translate(800, 590)
    ctx.rotate(0.1)
    ctx.font = '40px Apple Color Emoji'
    ctx.fillStyle = '#000'
    ctx.fillText('🃏', 80, 5)
    ctx.restore()
    ctx.font = '18px Poppins Semi Bold'
    drawTextShadow(ctx, 'CARDS', 935, 597)
    ctx.fillStyle = contrastColor(colorVariation(data.favoriteColor, -50))
    ctx.fillText('CARDS', 935, 597)


    // DRAW THE reputation
    ctx.fillStyle = colorVariation(data.favoriteColor, -50)
    drawRoundedRectangle(ctx, 850, 480, 300, 70, 25)
    ctx.fill()
    // DRAW THE REPUTATION TEXT
    ctx.fillStyle = contrastColor(colorVariation(data.favoriteColor, -50))
    ctx.font = '35px Montserrat Bold'
    writeTextCentralizedConsidering(ctx, `${data.reputation}`, 860, 530, 280)
    // DRAW REPUTATION EMOJI (3 emojis) ROTATED ABOVE THE TEXT
    ctx.save()
    ctx.translate(800, 480)
    ctx.rotate(-0.07)
    ctx.font = '37px Apple Color Emoji'
    ctx.fillStyle = '#000'
    ctx.fillText('🌠', 80, 15)
    ctx.restore()
    ctx.font = '16px Poppins Semi Bold'
    drawTextShadow(ctx, 'REPUTAÇÃO', 935, 487)
    ctx.fillStyle = contrastColor(colorVariation(data.favoriteColor, -50))
    ctx.fillText('REPUTAÇÃO', 935, 487)

    // DRAW THE COINS
    ctx.fillStyle = colorVariation(data.favoriteColor, -50)
    drawRoundedRectangle(ctx, 850, 700, 300, 70, 25)
    ctx.fill()

    // DRAW THE COINS TEXT
    ctx.fillStyle = contrastColor(colorVariation(data.favoriteColor, -50))
    ctx.font = '35px Montserrat Bold'
    writeTextCentralizedConsidering(ctx, readableNumber(data.coins), 860, 750, 280)
    // DRAW COINS EMOIJI (3 emojis) ROTATED ABOVE THE TEXT
    ctx.save()
    ctx.translate(800, 700)
    ctx.rotate(0.1)
    ctx.font = '40px Apple Color Emoji'
    ctx.fillStyle = '#000'
    ctx.fillText('💸', 80, 5)
    ctx.restore()
    ctx.font = '18px Poppins Semi Bold'
    drawTextShadow(ctx, 'MOEDAS', 935, 707)
    ctx.fillStyle = contrastColor(colorVariation(data.favoriteColor, -50))
    ctx.fillText('MOEDAS', 935, 707)
}

const confidentialityOverlay = async (ctx: SKRSContext2D) => {
    // DRAW THE CONFIDENTIALITY OVERLAY
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, 1200, 800)
    // WRITE THE CONFIDENTIALITY TEXT
    ctx.fillStyle = '#fff'
    ctx.font = '35px Montserrat Bold'
    writeTextCentralizedConsidering(ctx, 'Este recurso ainda está sob desenvolvimento', 0, 400, 1200)
    ctx.font = '35px Montserrat Bold'
    writeTextCentralizedConsidering(ctx, 'e pode sofrer alterações futuras.', 0, 440, 1200)

    // WRITE THE CONFIDENTIALITY TEXT
    ctx.fillStyle = '#fff'
    ctx.font = '20px Montserrat Bold'
    writeTextCentralizedConsidering(ctx, 'O compartilhamento deste e quaisquer outros arquivos é veementemente vetado.', 0, 700, 1200)
    writeTextCentralizedConsidering(ctx, 'Este arquivo é de uso exclusivo e intransferível.', 0, 730, 1200)

    // WRITE THE CONFIDENTIALITY TEXT
    ctx.fillStyle = '#fff'
    ctx.font = '20px Montserrat Bold'
    writeTextCentralizedConsidering(ctx, 'O compartilhamento deste e quaisquer outros arquivos é veementemente vetado.', 0, 100, 1200)
    writeTextCentralizedConsidering(ctx, 'Este arquivo é de uso exclusivo e intransferível.', 0, 130, 1200)
}

const previewOverlay = (ctx: SKRSContext2D) => {
    // DRAW THE PREVIEW OVERLAY
    // gradient from black to transparent
    const gradient = ctx.createLinearGradient(0, 0, 0, 800)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1200, 800)
    // WRITE THE PREVIEW TEXT
    ctx.fillStyle = '#fff'
    ctx.font = '32px Montserrat Extra Bold'
    writeTextCentralizedConsidering(ctx, 'Este é um preview do seu perfil e como ele ficará com este item.', 0, 685, 1200)
    ctx.font = '28px Montserrat Bold'
    writeTextCentralizedConsidering(ctx, 'Prossiga com a compra utilizando os botões de confirmação.', 0, 730, 1200)
}
 */
export default async (id: string, data: ChartData): Promise<void> => {
  const { ctx, finish } = create(MAX_WIDTH, MAX_HEIGHT)

  // fill with f0f0f0
  ctx.fillStyle = '#f0f0f0'
  ctx.fillRect(0, 0, MAX_WIDTH, MAX_HEIGHT)

  // white, to light pink, light purple, and white (darker than #FFD1DC or #E6E6FA)
  generateGradients(ctx, TypeDefs[data.type].color)
  generateBottomGradient(ctx, TypeDefs[data.type].color)

  // inter extra bold
  const titleY = 313
  ctx.font = '230px Inter Black'
  // use gradient with type color: the type follows the same color, the second name is darker
  const gradient = ctx.createLinearGradient(0, 0, 0, 1800)
  gradient.addColorStop(0, TypeDefs[data.type].color)
  gradient.addColorStop(0.5, colorVariation(TypeDefs[data.type].color, -20))
  ctx.fillStyle = gradient
  const size = ctx.measureText(TypeDefs[data.type].title[0])
  const titleX = (MAX_WIDTH - size.width - ctx.measureText(TypeDefs[data.type].title[1]).width) / 2
  ctx.fillText(TypeDefs[data.type].title[0], titleX, titleY)
  ctx.fillStyle = colorVariation(TypeDefs[data.type].color, -20)
  ctx.font = '230px Inter Medium'
  ctx.fillText(TypeDefs[data.type].title[1], titleX + size.width, titleY)

  // #f0f0f0 from 300 until the end
  const NAME_SPACE = 280
  const NAME_X = 50
  ctx.fillStyle = '#f0f0f0fe'
  ctx.fillRect(NAME_X, NAME_SPACE, MAX_WIDTH - (NAME_X * 2), MAX_HEIGHT - NAME_SPACE - NAME_X)

  return finish(id)
}