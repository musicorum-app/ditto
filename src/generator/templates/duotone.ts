import { createQuadro, loadImage, loadImageFromDisk } from '../utils/toolbox.js'
import { DuotoneData, GenerateData } from '../../types.js'
import { DUOTONE_HEIGHT, DUOTONE_WIDTH } from '../constants.js'
import { duotonify, massDuotonify } from '../../pool/pool.js'
import { extractIDFromURL } from '../../imaging.js'

const DUOTONE_MARGIN = 30
const DUOTONE_AVATAR_WIDTH = 360
const DUOTONE_AVATAR_SIZE = 380
const DUOTONE_IMAGE_GAP = 10
const DUOTONE_IMAGE_SIZE = Math.ceil((DUOTONE_HEIGHT - (DUOTONE_MARGIN * 2) - (DUOTONE_IMAGE_GAP * 2)) / 3)

export default async (
  id: string,
  { items, title, palette, subtitle }: DuotoneData,
  { user, hide_username }: GenerateData
): Promise<void> => {
  const { ctx, finish } = createQuadro(DUOTONE_WIDTH, DUOTONE_HEIGHT)

  const duotonesIDs = items.map((i) => extractIDFromURL(i.image)!)
  const userDuotoneID = extractIDFromURL(user!.image!)!

  await massDuotonify(duotonesIDs, DUOTONE_IMAGE_SIZE, palette)
  await duotonify(userDuotoneID, DUOTONE_AVATAR_SIZE, palette)

  const userDuotoneImage = await loadImageFromDisk(userDuotoneID + 'duotone', DUOTONE_AVATAR_SIZE)
  const duotones = await Promise.all(duotonesIDs.map((i) => loadImageFromDisk(i + 'duotone', DUOTONE_IMAGE_SIZE)))

  ctx.fillStyle = palette[1]
  ctx.fillRect(0, 0, DUOTONE_WIDTH, DUOTONE_HEIGHT)

  // Duotone background && avatar image

  ctx.imageFit = 'cover'

  const userImage = await loadImage(user!.image!, DUOTONE_AVATAR_SIZE)
  ctx.drawImage(userDuotoneImage, 0, 0, DUOTONE_AVATAR_WIDTH, DUOTONE_HEIGHT)
  ctx.yAlign = 'center'
  ctx.drawImage(userImage, DUOTONE_MARGIN * 2, DUOTONE_HEIGHT / 2, DUOTONE_AVATAR_SIZE, DUOTONE_AVATAR_SIZE)

  // Duotone background images
  ctx.globalAlpha = 0.35

  ctx.xAlign = 'right'
  ctx.yAlign = 'top'

  duotones.forEach((image, i) => {
    let imageX = i > 2 ? 0 : 1
    imageX = DUOTONE_WIDTH - DUOTONE_MARGIN - ((DUOTONE_IMAGE_GAP + DUOTONE_IMAGE_SIZE) * imageX)

    const imageY = DUOTONE_MARGIN + ((i > 2 ? i - 3 : i) * (DUOTONE_IMAGE_SIZE + DUOTONE_IMAGE_GAP))
    ctx.drawImage(image, ~~imageX, ~~imageY, DUOTONE_IMAGE_SIZE, DUOTONE_IMAGE_SIZE)
  })

  ctx.globalAlpha = 1.0

  // Title & subtitle

  ctx.textOverflow = 'ellipsis'
  ctx.fillStyle = palette[0]
  ctx.textBaseline = 'hanging'
  ctx.font = '50px Montserrat Black, Noto Current'

  ctx.writeTextLine(title, DUOTONE_AVATAR_WIDTH + DUOTONE_MARGIN, DUOTONE_MARGIN / 2, DUOTONE_WIDTH - DUOTONE_AVATAR_WIDTH - (DUOTONE_MARGIN * 2))

  ctx.font = '25px Montserrat Extra Bold, Noto Current'
  ctx.writeTextLine(subtitle, DUOTONE_AVATAR_WIDTH + DUOTONE_MARGIN, DUOTONE_MARGIN / 2 + 55, DUOTONE_WIDTH - DUOTONE_AVATAR_WIDTH - (DUOTONE_MARGIN * 2))

  // Items text

  const textsX = DUOTONE_AVATAR_WIDTH + (DUOTONE_MARGIN * 3)
  const textsY = (DUOTONE_HEIGHT - DUOTONE_AVATAR_SIZE) * 0.5
  const textsHeight = (DUOTONE_HEIGHT - textsY - (DUOTONE_MARGIN * 0.4)) / items.slice(0, 6).length
  const maxWidthTexts = DUOTONE_WIDTH - textsX - (DUOTONE_MARGIN * 2) - 10

  for (let i = 0; i < 5; i++) {
    const {
      name,
      secondary
    } = items[i]

    const textY = textsY + (textsHeight * i)
    const textContentY = textY + (textsHeight * 0.6)
    const textContentX = textsX + 60

    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.font = '55px Montserrat Extra Bold, Noto Current'
    ctx.writeTextLine((Number(i) + 1).toString(), textsX + 25, textY + (textsHeight * 0.5), 50)

    ctx.textAlign = 'left'
    if (secondary) {
      ctx.textBaseline = 'bottom'
      ctx.font = '35px "Montserrat Black, Noto Current"'
      ctx.writeTextLine(name, textContentX, textContentY + 2, maxWidthTexts)

      ctx.globalAlpha = 0.8
      ctx.textBaseline = 'top'
      ctx.font = '20px Montserrat Extra Bold, Noto Current'
      ctx.writeTextLine(secondary, textContentX, textContentY - 2, maxWidthTexts)
      ctx.globalAlpha = 1
    } else {
      ctx.font = '35px Montserrat Black, Noto Current'
      ctx.writeTextLine(name, textContentX, textY + (textsHeight * 0.5), maxWidthTexts)
    }
  }

  // User name
  if (!hide_username) {
    ctx.xAlign = 'left'
    ctx.yAlign = 'bottom'
    ctx.globalAlpha = 0.6
    ctx.fillStyle = palette[0]

    const usernameBoxYBottom = (DUOTONE_HEIGHT / 2) + (DUOTONE_AVATAR_SIZE / 2)
    const usernameBoxHeight = 40

    ctx.fillRect(DUOTONE_MARGIN * 2, usernameBoxYBottom, DUOTONE_AVATAR_SIZE, usernameBoxHeight)

    ctx.fillStyle = palette[1]
    ctx.globalAlpha = 1

    const userMargin = 5

    ctx.font = '25px Montserrat Black, Noto Current'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.writeTextLine(user!.name || user!.username, (DUOTONE_MARGIN * 2) + userMargin, usernameBoxYBottom - (usernameBoxHeight / 2), DUOTONE_AVATAR_SIZE - (userMargin * 2))
  }

  return finish(id)
}
