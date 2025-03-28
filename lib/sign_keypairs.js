const keypairs = require('@xhbmygod/ripple-keypairs')
const {
  encodeForMultisigning,
  encodeForSigning,
  encode,
} = require('@xhbmygod/ripple-binary-codec')
const hashes = require('@xhbmygod/ripple-binary-codec/dist/hashes')
const hashprefixes = require('@xhbmygod/ripple-binary-codec/dist/hash-prefixes')
const sortSigners = require('./sort_signer')

const computeBinaryTransactionHash = txBlobHex => {
  const prefix = Buffer.from(hashprefixes.HashPrefix.transactionID).toString('hex').toUpperCase()
  return Buffer.from(hashes.sha512Half(Buffer.from(prefix + txBlobHex, 'hex'))).toString('hex').toUpperCase()
}

const computeSignature = (tx, privateKey, signAs, definitions) => {
  var signingData = signAs ? encodeForMultisigning(tx, signAs, definitions) : encodeForSigning(tx, definitions)
  return keypairs.sign(signingData, privateKey)
}

function sign_keypair (txJSON, keypair) {
  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {}

  var tx = JSON.parse(txJSON);

  tx.SigningPubKey = options.signAs ? '' : keypair.publicKey
  const definitions = options.definitions ? options.definitions : undefined

  if (options.signAs) {
    var signer = {
      Account: options.signAs,
      SigningPubKey: keypair.publicKey,
      TxnSignature: computeSignature(tx, keypair.privateKey, options.signAs, definitions)
    };
    if (!tx.Signers) tx.Signers = []
    tx.Signers.push({ Signer: signer })
    tx.Signers = sortSigners(tx.Signers)
  } else {
    tx.TxnSignature = computeSignature(tx, keypair.privateKey, undefined, definitions)
  }

  const serialized = encode(tx, definitions)
  
  return {
    id: computeBinaryTransactionHash(serialized),
    signedTransaction: serialized,
    txJson: tx,
  }
}

module.exports = sign_keypair
