import nacl from 'tweetnacl'
import { fromUint8Array, toUint8Array } from 'js-base64'
import { Haiku } from 'Common/types'
import { Psalm } from './types'
import { assertType } from 'typescript-is' 


export function decrypt(haiku: Haiku, toSecretKeyString: string) {
  const innerHaikuBinary = nacl.box.open(
    toUint8Array(haiku.box),
    toUint8Array(haiku.nonce),
    toUint8Array(haiku.publicKey),
    toUint8Array(toSecretKeyString))
  if (innerHaikuBinary)  {
    const innerHaiku = assertType<Haiku>(JSON.parse(Buffer.from(innerHaikuBinary).toString()))

    const psalmBinary = nacl.box.open(
      toUint8Array(innerHaiku.box),
      toUint8Array(innerHaiku.nonce),
      toUint8Array(innerHaiku.publicKey),
      toUint8Array(toSecretKeyString))

    if (psalmBinary) {
      const psalm = assertType<Psalm>(JSON.parse(Buffer.from(psalmBinary).toString()))

      return {psalm, fromPublicKey: innerHaiku.publicKey}
    } else {
      return null
    }
  } else {
    return null
  }  
}


// this convoluted encryption scheme is necessary to able both sign content with public key
// and distribute it anonymously
export function encrypt(
  psalm: Psalm,
  toPublicKey: Uint8Array | string,
  fromSecretKey: Uint8Array | string,
  fromPublicKey: Uint8Array | string
) : Haiku {
  if (typeof toPublicKey === 'string') {
    toPublicKey = toUint8Array(toPublicKey)
  }
  if (typeof fromSecretKey === 'string') {
    fromSecretKey = toUint8Array(fromSecretKey)
  }
  if (typeof fromPublicKey === 'string') {
    fromPublicKey = toUint8Array(fromPublicKey)
  }

  const innerNonce = nacl.randomBytes(24)
  const innerBox = nacl.box(Buffer.from(JSON.stringify(psalm)), innerNonce, toPublicKey, fromSecretKey)

  const innerCypher = {
    box: fromUint8Array(innerBox, true),
    nonce: fromUint8Array(innerNonce, true),
    publicKey: fromUint8Array(fromPublicKey, true),
  }

  const { publicKey: oneTimePublicKey, secretKey: oneTimeSecretKey } = nacl.box.keyPair()
  const nonce = nacl.randomBytes(24)
  const box = nacl.box(Buffer.from(JSON.stringify(innerCypher)), nonce, toPublicKey, oneTimeSecretKey)

  return {
    box: fromUint8Array(box, true),
    nonce: fromUint8Array(nonce, true),
    publicKey: fromUint8Array(oneTimePublicKey, true)
  }
}