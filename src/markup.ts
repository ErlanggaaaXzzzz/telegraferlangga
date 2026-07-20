import {
  ForceReply,
  InlineKeyboardButton,
  InlineKeyboardMarkup,
  KeyboardButton,
  ReplyKeyboardMarkup,
  ReplyKeyboardRemove,
} from './core/types/typegram'
import { is2D } from './core/helpers/check'

type Hideable<B> = B & { hide?: boolean }
type HideableKBtn = Hideable<KeyboardButton>
type HideableIKBtn = Hideable<InlineKeyboardButton>

export class Markup<
  T extends
    | InlineKeyboardMarkup
    | ReplyKeyboardMarkup
    | ReplyKeyboardRemove
    | ForceReply,
> {
  constructor(readonly reply_markup: T) {}

  selective<T extends ForceReply | ReplyKeyboardMarkup>(
    this: Markup<T>,
    value = true
  ) {
    return new Markup<T>({ ...this.reply_markup, selective: value })
  }

  placeholder<T extends ForceReply | ReplyKeyboardMarkup>(
    this: Markup<T>,
    placeholder: string
  ) {
    return new Markup<T>({
      ...this.reply_markup,
      input_field_placeholder: placeholder,
    })
  }

  resize(this: Markup<ReplyKeyboardMarkup>, value = true) {
    return new Markup<ReplyKeyboardMarkup>({
      ...this.reply_markup,
      resize_keyboard: value,
    })
  }

  oneTime(this: Markup<ReplyKeyboardMarkup>, value = true) {
    return new Markup<ReplyKeyboardMarkup>({
      ...this.reply_markup,
      one_time_keyboard: value,
    })
  }

  persistent(this: Markup<ReplyKeyboardMarkup>, value = true) {
    return new Markup<ReplyKeyboardMarkup>({
      ...this.reply_markup,
      is_persistent: value,
    })
  }
}

export * as button from './button'

export function removeKeyboard(): Markup<ReplyKeyboardRemove> {
  return new Markup<ReplyKeyboardRemove>({ remove_keyboard: true })
}

export function forceReply(): Markup<ForceReply> {
  return new Markup<ForceReply>({ force_reply: true })
}

export function keyboard(buttons: HideableKBtn[][]): Markup<ReplyKeyboardMarkup>
export function keyboard(
  buttons: HideableKBtn[],
  options?: Partial<KeyboardBuildingOptions<HideableKBtn>>
): Markup<ReplyKeyboardMarkup>
export function keyboard(
  buttons: HideableKBtn[] | HideableKBtn[][],
  options?: Partial<KeyboardBuildingOptions<HideableKBtn>>
): Markup<ReplyKeyboardMarkup> {
  const keyboard = buildKeyboard(buttons, {
    columns: 1,
    ...options,
  })
  return new Markup<ReplyKeyboardMarkup>({ keyboard })
}

export function inlineKeyboard(
  buttons: HideableIKBtn[][]
): Markup<InlineKeyboardMarkup>
export function inlineKeyboard(
  buttons: HideableIKBtn[],
  options?: Partial<KeyboardBuildingOptions<HideableIKBtn>>
): Markup<InlineKeyboardMarkup>
export function inlineKeyboard(
  buttons: HideableIKBtn[] | HideableIKBtn[][],
  options?: Partial<KeyboardBuildingOptions<HideableIKBtn>>
): Markup<InlineKeyboardMarkup> {
  const inlineKeyboard = buildKeyboard(buttons, {
    columns: buttons.length,
    ...options,
  })
  return new Markup<InlineKeyboardMarkup>({ inline_keyboard: inlineKeyboard })
}

export interface PaginationOptions {
  page: number
  totalPages: number
  prevLabel?: string
  nextLabel?: string
  dataPrefix?: string
  extraButtons?: HideableIKBtn[][]
}

export function pagination(
  options: PaginationOptions
): Markup<InlineKeyboardMarkup> {
  const {
    page,
    totalPages,
    prevLabel = '◀️',
    nextLabel = '▶️',
    dataPrefix = 'page',
    extraButtons = [],
  } = options

  const navRow: InlineKeyboardButton[] = []
  if (page > 1) {
    navRow.push({
      text: prevLabel,
      callback_data: `${dataPrefix}:${page - 1}`,
    })
  }
  navRow.push({
    text: `${page}/${totalPages}`,
    callback_data: `${dataPrefix}:noop`,
  })
  if (page < totalPages) {
    navRow.push({
      text: nextLabel,
      callback_data: `${dataPrefix}:${page + 1}`,
    })
  }

  return inlineKeyboard([...extraButtons, navRow])
}

export interface ConfirmOptions {
  yesLabel?: string
  noLabel?: string
}

export function confirm(
  yesData: string,
  noData: string,
  options: ConfirmOptions = {}
): Markup<InlineKeyboardMarkup> {
  const { yesLabel = '✅ Ya', noLabel = '❌ Tidak' } = options
  return inlineKeyboard([
    { text: yesLabel, callback_data: yesData },
    { text: noLabel, callback_data: noData },
  ])
}

export function menuFromObject(
  buttonMap: Record<string, string>,
  options?: Partial<KeyboardBuildingOptions<HideableIKBtn>>
): Markup<InlineKeyboardMarkup> {
  const buttons: HideableIKBtn[] = Object.entries(buttonMap).map(
    ([text, callback_data]) => ({ text, callback_data })
  )
  return inlineKeyboard(buttons, options)
}

export function urlButtonRow(
  linkMap: Record<string, string>
): Markup<InlineKeyboardMarkup> {
  const buttons: HideableIKBtn[] = Object.entries(linkMap).map(
    ([text, url]) => ({ text, url })
  )
  return inlineKeyboard([buttons])
}

export function toggleButton(
  label: string,
  isActive: boolean,
  callbackData: string
): InlineKeyboardButton {
  return {
    text: `${isActive ? '✅' : '❌'} ${label}`,
    callback_data: callbackData,
  }
}

interface KeyboardBuildingOptions<B extends HideableKBtn | HideableIKBtn> {
  wrap?: (btn: B, index: number, currentRow: B[]) => boolean
  columns: number
}

function buildKeyboard<B extends HideableKBtn | HideableIKBtn>(
  buttons: B[] | B[][],
  options: KeyboardBuildingOptions<B>
): B[][] {
  const result: B[][] = []
  if (!Array.isArray(buttons)) {
    return result
  }
  if (is2D(buttons)) {
    return buttons.map((row) => row.filter((button) => !button.hide))
  }
  const wrapFn =
    options.wrap !== undefined
      ? options.wrap
      : (_btn: B, _index: number, currentRow: B[]) =>
          currentRow.length >= options.columns
  let currentRow: B[] = []
  let index = 0
  for (const btn of buttons.filter((button) => !button.hide)) {
    if (wrapFn(btn, index, currentRow) && currentRow.length > 0) {
      result.push(currentRow)
      currentRow = []
    }
    currentRow.push(btn)
    index++
  }
  if (currentRow.length > 0) {
    result.push(currentRow)
  }
  return result
}
