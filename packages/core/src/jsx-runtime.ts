export type Attributes = Record<string, any>

export type DOMOutputSpecElement = 0 | Attributes | DOMOutputSpecArray
/**
 * Better describes the output of a `renderHTML` function in prosemirror
 * @see https://prosemirror.net/docs/ref/#model.DOMOutputSpec
 */
export type DOMOutputSpecArray =
  | [string]
  | [string, Attributes]
  | [string, 0]
  | [string, Attributes, 0]
  | [string, Attributes, DOMOutputSpecArray | 0]
  | [string, DOMOutputSpecArray]

// JSX types for Tiptap's JSX runtime
// These types only apply when using @jsxImportSource @tiptap/core
// oxlint-disable-next-lineno-namespace
export namespace JSX {
  export type Element = DOMOutputSpecArray
  export interface IntrinsicElements {
    // oxlint-disable-next-lineno-explicit-any
    [key: string]: any
  }
  export interface ElementChildrenAttribute {
    children: unknown
  }
}

export type JSXRenderer = (
  tag: 'slot' | string | ((props?: Attributes) => DOMOutputSpecArray | DOMOutputSpecElement),
  props?: Attributes,
  ...children: JSXRenderer[]
) => DOMOutputSpecArray | DOMOutputSpecElement

export function Fragment(props: { children: JSXRenderer[] }) {
  return props.children
}

function isDOMOutputSpec(elements: Array<unknown>): boolean {
  const firstElement = elements[0]
  const secondElement = elements.length > 1 ? elements[1] : undefined

  // Check if the first element is a string (tag name)
  if (typeof firstElement !== 'string') {
    return false
  }

  // when the second element is a string, undefined or 0, it is considered a valid DOMOutputSpec
  // 0 is used to indicate a content hole in ProseMirror's DOMOutputSpec
  if (secondElement === undefined || secondElement === 0 || typeof secondElement === 'string') {
    return true
  }

  if (typeof secondElement === 'object' && secondElement !== null) {
    // if the second element is an object, it can be either an attributes object or another DOMOutputSpecArray
    if (!Array.isArray(secondElement)) {
      return true
    }

    // if the second element is an array, check if it is a valid DOMOutputSpecArray
    return typeof secondElement[0] === 'string'
  }

  return false
}

export const h: JSXRenderer = (tag, attributes) => {
  // Treat the slot tag as the Prosemirror hole to render content into
  if (tag === 'slot') {
    return 0
  }

  // If the tag is a function, call it with the props
  if (tag instanceof Function) {
    return tag(attributes)
  }

  const { children, ...rest } = attributes ?? {}

  if (tag === 'svg') {
    throw new Error(
      'SVG elements are not supported in the JSX syntax, use the array syntax instead',
    )
  }

  if (Array.isArray(children)) {
    if (children.length === 0) {
      return [tag, rest]
    }

    // This is a single DOMOutputSpecArray child, not multiple children.
    if (isDOMOutputSpec(children)) {
      return [tag, rest, children]
    }

    // Filter out null or undefined children.
    const validChildren = children.filter(child => child != null)

    if (validChildren.length === 0) {
      return [tag, rest]
    }

    // Spread multiple children into the result array.
    return [tag, rest, ...validChildren]
  }

  if (children !== undefined && children !== null) {
    return [tag, rest, children]
  }

  return [tag, rest]
}

// See
// https://esbuild.github.io/api/#jsx-import-source
// https://www.typescriptlang.org/tsconfig/#jsxImportSource

export { h as createElement, h as jsx, h as jsxDEV, h as jsxs }
