import { DidsModule, InitConfig, KeyType, LogLevel, TypedArrayEncoder } from '@aries-framework/core'

const config: InitConfig = {
  label: 'docs-agent-nodejs-register-schema-and-cred-def',
  walletConfig: {
    id: 'wallet-id',
    key: 'testkey0000000000000000000000000',
  },
}

// start-section-1
import { Agent } from '@aries-framework/core'
import { agentDependencies } from '@aries-framework/node'
import { AskarModule } from '@aries-framework/askar'
import { ariesAskar } from '@hyperledger/aries-askar-nodejs'
import {
  IndyVdrAnonCredsRegistry,
  IndyVdrIndyDidRegistrar,
  IndyVdrIndyDidResolver,
  IndyVdrModule,
} from '@aries-framework/indy-vdr'
import { indyVdr } from '@hyperledger/indy-vdr-nodejs'
import { AnonCredsModule } from '@aries-framework/anoncreds'
import { AnonCredsRsModule } from '@aries-framework/anoncreds-rs'
import { anoncreds } from '@hyperledger/anoncreds-nodejs'

const agent = new Agent({
  config,
  dependencies: agentDependencies,
  modules: {
    // Register the Askar module on the agent
    // We do this to have access to a wallet
    askar: new AskarModule({
      ariesAskar,
    }),
    anoncredsRs: new AnonCredsRsModule({
      anoncreds,
    }),
    indyVdr: new IndyVdrModule({
      indyVdr,
      networks: [
        {
          isProduction: false,
          indyNamespace: 'bcovrin:test',
          genesisTransactions: '<genesis transactions>',
          connectOnStartup: true,
        },
      ],
    }),
    anoncreds: new AnonCredsModule({
      registries: [new IndyVdrAnonCredsRegistry()],
    }),
    dids: new DidsModule({
      registrars: [new IndyVdrIndyDidRegistrar()],
      resolvers: [new IndyVdrIndyDidResolver()],
    }),
  },
})
// end-section-1

// start-section-2
const seed = TypedArrayEncoder.fromString(`<seed>`) // What you input on bcovrin. Should be kept secure in production!
const unqualifiedIndyDid = `<unqualifiedIndyDid>` // will be returned after registering seed on bcovrin
const indyDid = `did:indy:bcovrin:test:${unqualifiedIndyDid}`

await agent.dids.import({
  did: '<did>',
  overwrite: true,
  privateKeys: [
    {
      privateKey: seed,
      keyType: KeyType.Ed25519,
    },
  ],
})
// end-section-2

// start-section-3
const schemaResult = await agent.modules.anoncreds.registerSchema({
  schema: {
    attrNames: ['name'],
    issuerId: indyDid,
    name: 'Example Schema to register',
    version: '1.0.0',
  },
  options: {},
})

if (schemaResult.schemaState.state === 'failed') {
  throw new Error(`Error creating schema: ${schemaResult.schemaState.reason}`)
}
// end-section-3

// start-section-4
const credentialDefinitionResult = await agent.modules.anoncreds.registerCredentialDefinition({
  credentialDefinition: {
    tag: 'default',
    issuerId: indyDid,
    schemaId: schemaResult.schemaState.schemaId,
  },
  options: {},
})

if (credentialDefinitionResult.credentialDefinitionState.state === 'failed') {
  throw new Error(
    `Error creating credential definition: ${credentialDefinitionResult.credentialDefinitionState.reason}`
  )
}
// end-section-4