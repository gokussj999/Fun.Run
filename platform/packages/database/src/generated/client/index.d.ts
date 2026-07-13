
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model Profile
 * User identity and custodial wallet state.
 */
export type Profile = $Result.DefaultSelection<Prisma.$ProfilePayload>
/**
 * Model Coin
 * Bonding curve coin — mirrors the on-chain BondingCurve PDA.
 */
export type Coin = $Result.DefaultSelection<Prisma.$CoinPayload>
/**
 * Model Holding
 * Per-user token holdings with cost basis tracking.
 */
export type Holding = $Result.DefaultSelection<Prisma.$HoldingPayload>
/**
 * Model Transaction
 * Immutable trade event log — never update, never delete.
 */
export type Transaction = $Result.DefaultSelection<Prisma.$TransactionPayload>
/**
 * Model Candle
 * OHLCV candles — upserted on every trade.
 */
export type Candle = $Result.DefaultSelection<Prisma.$CandlePayload>
/**
 * Model ReferralAccount
 * Referral relationship and accumulated fee balances.
 */
export type ReferralAccount = $Result.DefaultSelection<Prisma.$ReferralAccountPayload>
/**
 * Model TreasuryEvent
 * Treasury revenue audit trail — append-only, never delete.
 */
export type TreasuryEvent = $Result.DefaultSelection<Prisma.$TreasuryEventPayload>
/**
 * Model AuditLog
 * Immutable admin action log — never update, never delete.
 */
export type AuditLog = $Result.DefaultSelection<Prisma.$AuditLogPayload>
/**
 * Model IndexerState
 * Blockchain indexer position — singleton row (id = 'singleton').
 */
export type IndexerState = $Result.DefaultSelection<Prisma.$IndexerStatePayload>
/**
 * Model PendingTx
 * On-chain transaction lifecycle record — one row per logical operation attempt.
 * Provides idempotency, duplicate protection, and full audit trail for all Solana txs.
 */
export type PendingTx = $Result.DefaultSelection<Prisma.$PendingTxPayload>
/**
 * Model PushSubscription
 * Device tokens for push notifications.
 */
export type PushSubscription = $Result.DefaultSelection<Prisma.$PushSubscriptionPayload>
/**
 * Model Deposit
 * On-chain SOL deposit credited to custodial wallet (Sprint 7).
 */
export type Deposit = $Result.DefaultSelection<Prisma.$DepositPayload>
/**
 * Model DepositScan
 * Deposit scanner cursor per wallet.
 */
export type DepositScan = $Result.DefaultSelection<Prisma.$DepositScanPayload>
/**
 * Model Withdrawal
 * Withdrawal request (Sprint 7).
 */
export type Withdrawal = $Result.DefaultSelection<Prisma.$WithdrawalPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const UserRole: {
  USER: 'USER',
  CREATOR: 'CREATOR',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN'
};

export type UserRole = (typeof UserRole)[keyof typeof UserRole]


export const CoinStatus: {
  ACTIVE: 'ACTIVE',
  GRADUATING: 'GRADUATING',
  GRADUATED: 'GRADUATED',
  PAUSED: 'PAUSED'
};

export type CoinStatus = (typeof CoinStatus)[keyof typeof CoinStatus]


export const TradeType: {
  BUY: 'BUY',
  SELL: 'SELL'
};

export type TradeType = (typeof TradeType)[keyof typeof TradeType]


export const Timeframe: {
  m1: 'm1',
  m5: 'm5',
  m15: 'm15',
  h1: 'h1',
  h4: 'h4',
  d1: 'd1'
};

export type Timeframe = (typeof Timeframe)[keyof typeof Timeframe]


export const AuditAction: {
  INITIALIZE: 'INITIALIZE',
  UPDATE_GLOBAL_CONFIG: 'UPDATE_GLOBAL_CONFIG',
  PAUSE_PROTOCOL: 'PAUSE_PROTOCOL',
  UNPAUSE_PROTOCOL: 'UNPAUSE_PROTOCOL',
  SWEEP_TREASURY: 'SWEEP_TREASURY',
  GRADUATION_INITIATED: 'GRADUATION_INITIATED',
  GRADUATION_COMPLETED: 'GRADUATION_COMPLETED',
  USER_BANNED: 'USER_BANNED',
  ADMIN_GRANTED: 'ADMIN_GRANTED'
};

export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction]


export const TxStatus: {
  BUILDING: 'BUILDING',
  SIGNING: 'SIGNING',
  PENDING: 'PENDING',
  SUBMITTED: 'SUBMITTED',
  CONFIRMED: 'CONFIRMED',
  FINALIZED: 'FINALIZED',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  ABANDONED: 'ABANDONED'
};

export type TxStatus = (typeof TxStatus)[keyof typeof TxStatus]

}

export type UserRole = $Enums.UserRole

export const UserRole: typeof $Enums.UserRole

export type CoinStatus = $Enums.CoinStatus

export const CoinStatus: typeof $Enums.CoinStatus

export type TradeType = $Enums.TradeType

export const TradeType: typeof $Enums.TradeType

export type Timeframe = $Enums.Timeframe

export const Timeframe: typeof $Enums.Timeframe

export type AuditAction = $Enums.AuditAction

export const AuditAction: typeof $Enums.AuditAction

export type TxStatus = $Enums.TxStatus

export const TxStatus: typeof $Enums.TxStatus

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Profiles
 * const profiles = await prisma.profile.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  const U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Profiles
   * const profiles = await prisma.profile.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.profile`: Exposes CRUD operations for the **Profile** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Profiles
    * const profiles = await prisma.profile.findMany()
    * ```
    */
  get profile(): Prisma.ProfileDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.coin`: Exposes CRUD operations for the **Coin** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Coins
    * const coins = await prisma.coin.findMany()
    * ```
    */
  get coin(): Prisma.CoinDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.holding`: Exposes CRUD operations for the **Holding** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Holdings
    * const holdings = await prisma.holding.findMany()
    * ```
    */
  get holding(): Prisma.HoldingDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.transaction`: Exposes CRUD operations for the **Transaction** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Transactions
    * const transactions = await prisma.transaction.findMany()
    * ```
    */
  get transaction(): Prisma.TransactionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.candle`: Exposes CRUD operations for the **Candle** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Candles
    * const candles = await prisma.candle.findMany()
    * ```
    */
  get candle(): Prisma.CandleDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.referralAccount`: Exposes CRUD operations for the **ReferralAccount** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more ReferralAccounts
    * const referralAccounts = await prisma.referralAccount.findMany()
    * ```
    */
  get referralAccount(): Prisma.ReferralAccountDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.treasuryEvent`: Exposes CRUD operations for the **TreasuryEvent** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more TreasuryEvents
    * const treasuryEvents = await prisma.treasuryEvent.findMany()
    * ```
    */
  get treasuryEvent(): Prisma.TreasuryEventDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.auditLog`: Exposes CRUD operations for the **AuditLog** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more AuditLogs
    * const auditLogs = await prisma.auditLog.findMany()
    * ```
    */
  get auditLog(): Prisma.AuditLogDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.indexerState`: Exposes CRUD operations for the **IndexerState** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more IndexerStates
    * const indexerStates = await prisma.indexerState.findMany()
    * ```
    */
  get indexerState(): Prisma.IndexerStateDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.pendingTx`: Exposes CRUD operations for the **PendingTx** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PendingTxes
    * const pendingTxes = await prisma.pendingTx.findMany()
    * ```
    */
  get pendingTx(): Prisma.PendingTxDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.pushSubscription`: Exposes CRUD operations for the **PushSubscription** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more PushSubscriptions
    * const pushSubscriptions = await prisma.pushSubscription.findMany()
    * ```
    */
  get pushSubscription(): Prisma.PushSubscriptionDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.deposit`: Exposes CRUD operations for the **Deposit** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Deposits
    * const deposits = await prisma.deposit.findMany()
    * ```
    */
  get deposit(): Prisma.DepositDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.depositScan`: Exposes CRUD operations for the **DepositScan** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more DepositScans
    * const depositScans = await prisma.depositScan.findMany()
    * ```
    */
  get depositScan(): Prisma.DepositScanDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.withdrawal`: Exposes CRUD operations for the **Withdrawal** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Withdrawals
    * const withdrawals = await prisma.withdrawal.findMany()
    * ```
    */
  get withdrawal(): Prisma.WithdrawalDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.19.3
   * Query Engine version: c2990dca591cba766e3b7ef5d9e8a84796e47ab7
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import Bytes = runtime.Bytes
  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    Profile: 'Profile',
    Coin: 'Coin',
    Holding: 'Holding',
    Transaction: 'Transaction',
    Candle: 'Candle',
    ReferralAccount: 'ReferralAccount',
    TreasuryEvent: 'TreasuryEvent',
    AuditLog: 'AuditLog',
    IndexerState: 'IndexerState',
    PendingTx: 'PendingTx',
    PushSubscription: 'PushSubscription',
    Deposit: 'Deposit',
    DepositScan: 'DepositScan',
    Withdrawal: 'Withdrawal'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "profile" | "coin" | "holding" | "transaction" | "candle" | "referralAccount" | "treasuryEvent" | "auditLog" | "indexerState" | "pendingTx" | "pushSubscription" | "deposit" | "depositScan" | "withdrawal"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      Profile: {
        payload: Prisma.$ProfilePayload<ExtArgs>
        fields: Prisma.ProfileFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ProfileFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ProfileFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          findFirst: {
            args: Prisma.ProfileFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ProfileFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          findMany: {
            args: Prisma.ProfileFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>[]
          }
          create: {
            args: Prisma.ProfileCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          createMany: {
            args: Prisma.ProfileCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ProfileCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>[]
          }
          delete: {
            args: Prisma.ProfileDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          update: {
            args: Prisma.ProfileUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          deleteMany: {
            args: Prisma.ProfileDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ProfileUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ProfileUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>[]
          }
          upsert: {
            args: Prisma.ProfileUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ProfilePayload>
          }
          aggregate: {
            args: Prisma.ProfileAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateProfile>
          }
          groupBy: {
            args: Prisma.ProfileGroupByArgs<ExtArgs>
            result: $Utils.Optional<ProfileGroupByOutputType>[]
          }
          count: {
            args: Prisma.ProfileCountArgs<ExtArgs>
            result: $Utils.Optional<ProfileCountAggregateOutputType> | number
          }
        }
      }
      Coin: {
        payload: Prisma.$CoinPayload<ExtArgs>
        fields: Prisma.CoinFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CoinFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoinPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CoinFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoinPayload>
          }
          findFirst: {
            args: Prisma.CoinFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoinPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CoinFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoinPayload>
          }
          findMany: {
            args: Prisma.CoinFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoinPayload>[]
          }
          create: {
            args: Prisma.CoinCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoinPayload>
          }
          createMany: {
            args: Prisma.CoinCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CoinCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoinPayload>[]
          }
          delete: {
            args: Prisma.CoinDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoinPayload>
          }
          update: {
            args: Prisma.CoinUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoinPayload>
          }
          deleteMany: {
            args: Prisma.CoinDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CoinUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CoinUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoinPayload>[]
          }
          upsert: {
            args: Prisma.CoinUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CoinPayload>
          }
          aggregate: {
            args: Prisma.CoinAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCoin>
          }
          groupBy: {
            args: Prisma.CoinGroupByArgs<ExtArgs>
            result: $Utils.Optional<CoinGroupByOutputType>[]
          }
          count: {
            args: Prisma.CoinCountArgs<ExtArgs>
            result: $Utils.Optional<CoinCountAggregateOutputType> | number
          }
        }
      }
      Holding: {
        payload: Prisma.$HoldingPayload<ExtArgs>
        fields: Prisma.HoldingFieldRefs
        operations: {
          findUnique: {
            args: Prisma.HoldingFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoldingPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.HoldingFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoldingPayload>
          }
          findFirst: {
            args: Prisma.HoldingFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoldingPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.HoldingFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoldingPayload>
          }
          findMany: {
            args: Prisma.HoldingFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoldingPayload>[]
          }
          create: {
            args: Prisma.HoldingCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoldingPayload>
          }
          createMany: {
            args: Prisma.HoldingCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.HoldingCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoldingPayload>[]
          }
          delete: {
            args: Prisma.HoldingDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoldingPayload>
          }
          update: {
            args: Prisma.HoldingUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoldingPayload>
          }
          deleteMany: {
            args: Prisma.HoldingDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.HoldingUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.HoldingUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoldingPayload>[]
          }
          upsert: {
            args: Prisma.HoldingUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$HoldingPayload>
          }
          aggregate: {
            args: Prisma.HoldingAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateHolding>
          }
          groupBy: {
            args: Prisma.HoldingGroupByArgs<ExtArgs>
            result: $Utils.Optional<HoldingGroupByOutputType>[]
          }
          count: {
            args: Prisma.HoldingCountArgs<ExtArgs>
            result: $Utils.Optional<HoldingCountAggregateOutputType> | number
          }
        }
      }
      Transaction: {
        payload: Prisma.$TransactionPayload<ExtArgs>
        fields: Prisma.TransactionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TransactionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TransactionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          findFirst: {
            args: Prisma.TransactionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TransactionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          findMany: {
            args: Prisma.TransactionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          create: {
            args: Prisma.TransactionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          createMany: {
            args: Prisma.TransactionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TransactionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          delete: {
            args: Prisma.TransactionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          update: {
            args: Prisma.TransactionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          deleteMany: {
            args: Prisma.TransactionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TransactionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TransactionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>[]
          }
          upsert: {
            args: Prisma.TransactionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TransactionPayload>
          }
          aggregate: {
            args: Prisma.TransactionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTransaction>
          }
          groupBy: {
            args: Prisma.TransactionGroupByArgs<ExtArgs>
            result: $Utils.Optional<TransactionGroupByOutputType>[]
          }
          count: {
            args: Prisma.TransactionCountArgs<ExtArgs>
            result: $Utils.Optional<TransactionCountAggregateOutputType> | number
          }
        }
      }
      Candle: {
        payload: Prisma.$CandlePayload<ExtArgs>
        fields: Prisma.CandleFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CandleFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandlePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CandleFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandlePayload>
          }
          findFirst: {
            args: Prisma.CandleFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandlePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CandleFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandlePayload>
          }
          findMany: {
            args: Prisma.CandleFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandlePayload>[]
          }
          create: {
            args: Prisma.CandleCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandlePayload>
          }
          createMany: {
            args: Prisma.CandleCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CandleCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandlePayload>[]
          }
          delete: {
            args: Prisma.CandleDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandlePayload>
          }
          update: {
            args: Prisma.CandleUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandlePayload>
          }
          deleteMany: {
            args: Prisma.CandleDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CandleUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CandleUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandlePayload>[]
          }
          upsert: {
            args: Prisma.CandleUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CandlePayload>
          }
          aggregate: {
            args: Prisma.CandleAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCandle>
          }
          groupBy: {
            args: Prisma.CandleGroupByArgs<ExtArgs>
            result: $Utils.Optional<CandleGroupByOutputType>[]
          }
          count: {
            args: Prisma.CandleCountArgs<ExtArgs>
            result: $Utils.Optional<CandleCountAggregateOutputType> | number
          }
        }
      }
      ReferralAccount: {
        payload: Prisma.$ReferralAccountPayload<ExtArgs>
        fields: Prisma.ReferralAccountFieldRefs
        operations: {
          findUnique: {
            args: Prisma.ReferralAccountFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralAccountPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.ReferralAccountFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralAccountPayload>
          }
          findFirst: {
            args: Prisma.ReferralAccountFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralAccountPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.ReferralAccountFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralAccountPayload>
          }
          findMany: {
            args: Prisma.ReferralAccountFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralAccountPayload>[]
          }
          create: {
            args: Prisma.ReferralAccountCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralAccountPayload>
          }
          createMany: {
            args: Prisma.ReferralAccountCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.ReferralAccountCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralAccountPayload>[]
          }
          delete: {
            args: Prisma.ReferralAccountDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralAccountPayload>
          }
          update: {
            args: Prisma.ReferralAccountUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralAccountPayload>
          }
          deleteMany: {
            args: Prisma.ReferralAccountDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.ReferralAccountUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.ReferralAccountUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralAccountPayload>[]
          }
          upsert: {
            args: Prisma.ReferralAccountUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$ReferralAccountPayload>
          }
          aggregate: {
            args: Prisma.ReferralAccountAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateReferralAccount>
          }
          groupBy: {
            args: Prisma.ReferralAccountGroupByArgs<ExtArgs>
            result: $Utils.Optional<ReferralAccountGroupByOutputType>[]
          }
          count: {
            args: Prisma.ReferralAccountCountArgs<ExtArgs>
            result: $Utils.Optional<ReferralAccountCountAggregateOutputType> | number
          }
        }
      }
      TreasuryEvent: {
        payload: Prisma.$TreasuryEventPayload<ExtArgs>
        fields: Prisma.TreasuryEventFieldRefs
        operations: {
          findUnique: {
            args: Prisma.TreasuryEventFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TreasuryEventPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.TreasuryEventFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TreasuryEventPayload>
          }
          findFirst: {
            args: Prisma.TreasuryEventFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TreasuryEventPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.TreasuryEventFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TreasuryEventPayload>
          }
          findMany: {
            args: Prisma.TreasuryEventFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TreasuryEventPayload>[]
          }
          create: {
            args: Prisma.TreasuryEventCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TreasuryEventPayload>
          }
          createMany: {
            args: Prisma.TreasuryEventCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.TreasuryEventCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TreasuryEventPayload>[]
          }
          delete: {
            args: Prisma.TreasuryEventDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TreasuryEventPayload>
          }
          update: {
            args: Prisma.TreasuryEventUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TreasuryEventPayload>
          }
          deleteMany: {
            args: Prisma.TreasuryEventDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.TreasuryEventUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.TreasuryEventUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TreasuryEventPayload>[]
          }
          upsert: {
            args: Prisma.TreasuryEventUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$TreasuryEventPayload>
          }
          aggregate: {
            args: Prisma.TreasuryEventAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateTreasuryEvent>
          }
          groupBy: {
            args: Prisma.TreasuryEventGroupByArgs<ExtArgs>
            result: $Utils.Optional<TreasuryEventGroupByOutputType>[]
          }
          count: {
            args: Prisma.TreasuryEventCountArgs<ExtArgs>
            result: $Utils.Optional<TreasuryEventCountAggregateOutputType> | number
          }
        }
      }
      AuditLog: {
        payload: Prisma.$AuditLogPayload<ExtArgs>
        fields: Prisma.AuditLogFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AuditLogFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AuditLogFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          findFirst: {
            args: Prisma.AuditLogFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AuditLogFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          findMany: {
            args: Prisma.AuditLogFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>[]
          }
          create: {
            args: Prisma.AuditLogCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          createMany: {
            args: Prisma.AuditLogCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AuditLogCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>[]
          }
          delete: {
            args: Prisma.AuditLogDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          update: {
            args: Prisma.AuditLogUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          deleteMany: {
            args: Prisma.AuditLogDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AuditLogUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AuditLogUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>[]
          }
          upsert: {
            args: Prisma.AuditLogUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AuditLogPayload>
          }
          aggregate: {
            args: Prisma.AuditLogAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAuditLog>
          }
          groupBy: {
            args: Prisma.AuditLogGroupByArgs<ExtArgs>
            result: $Utils.Optional<AuditLogGroupByOutputType>[]
          }
          count: {
            args: Prisma.AuditLogCountArgs<ExtArgs>
            result: $Utils.Optional<AuditLogCountAggregateOutputType> | number
          }
        }
      }
      IndexerState: {
        payload: Prisma.$IndexerStatePayload<ExtArgs>
        fields: Prisma.IndexerStateFieldRefs
        operations: {
          findUnique: {
            args: Prisma.IndexerStateFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndexerStatePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.IndexerStateFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndexerStatePayload>
          }
          findFirst: {
            args: Prisma.IndexerStateFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndexerStatePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.IndexerStateFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndexerStatePayload>
          }
          findMany: {
            args: Prisma.IndexerStateFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndexerStatePayload>[]
          }
          create: {
            args: Prisma.IndexerStateCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndexerStatePayload>
          }
          createMany: {
            args: Prisma.IndexerStateCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.IndexerStateCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndexerStatePayload>[]
          }
          delete: {
            args: Prisma.IndexerStateDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndexerStatePayload>
          }
          update: {
            args: Prisma.IndexerStateUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndexerStatePayload>
          }
          deleteMany: {
            args: Prisma.IndexerStateDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.IndexerStateUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.IndexerStateUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndexerStatePayload>[]
          }
          upsert: {
            args: Prisma.IndexerStateUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$IndexerStatePayload>
          }
          aggregate: {
            args: Prisma.IndexerStateAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateIndexerState>
          }
          groupBy: {
            args: Prisma.IndexerStateGroupByArgs<ExtArgs>
            result: $Utils.Optional<IndexerStateGroupByOutputType>[]
          }
          count: {
            args: Prisma.IndexerStateCountArgs<ExtArgs>
            result: $Utils.Optional<IndexerStateCountAggregateOutputType> | number
          }
        }
      }
      PendingTx: {
        payload: Prisma.$PendingTxPayload<ExtArgs>
        fields: Prisma.PendingTxFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PendingTxFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PendingTxPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PendingTxFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PendingTxPayload>
          }
          findFirst: {
            args: Prisma.PendingTxFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PendingTxPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PendingTxFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PendingTxPayload>
          }
          findMany: {
            args: Prisma.PendingTxFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PendingTxPayload>[]
          }
          create: {
            args: Prisma.PendingTxCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PendingTxPayload>
          }
          createMany: {
            args: Prisma.PendingTxCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PendingTxCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PendingTxPayload>[]
          }
          delete: {
            args: Prisma.PendingTxDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PendingTxPayload>
          }
          update: {
            args: Prisma.PendingTxUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PendingTxPayload>
          }
          deleteMany: {
            args: Prisma.PendingTxDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PendingTxUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PendingTxUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PendingTxPayload>[]
          }
          upsert: {
            args: Prisma.PendingTxUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PendingTxPayload>
          }
          aggregate: {
            args: Prisma.PendingTxAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePendingTx>
          }
          groupBy: {
            args: Prisma.PendingTxGroupByArgs<ExtArgs>
            result: $Utils.Optional<PendingTxGroupByOutputType>[]
          }
          count: {
            args: Prisma.PendingTxCountArgs<ExtArgs>
            result: $Utils.Optional<PendingTxCountAggregateOutputType> | number
          }
        }
      }
      PushSubscription: {
        payload: Prisma.$PushSubscriptionPayload<ExtArgs>
        fields: Prisma.PushSubscriptionFieldRefs
        operations: {
          findUnique: {
            args: Prisma.PushSubscriptionFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushSubscriptionPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.PushSubscriptionFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushSubscriptionPayload>
          }
          findFirst: {
            args: Prisma.PushSubscriptionFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushSubscriptionPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.PushSubscriptionFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushSubscriptionPayload>
          }
          findMany: {
            args: Prisma.PushSubscriptionFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushSubscriptionPayload>[]
          }
          create: {
            args: Prisma.PushSubscriptionCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushSubscriptionPayload>
          }
          createMany: {
            args: Prisma.PushSubscriptionCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.PushSubscriptionCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushSubscriptionPayload>[]
          }
          delete: {
            args: Prisma.PushSubscriptionDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushSubscriptionPayload>
          }
          update: {
            args: Prisma.PushSubscriptionUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushSubscriptionPayload>
          }
          deleteMany: {
            args: Prisma.PushSubscriptionDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.PushSubscriptionUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.PushSubscriptionUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushSubscriptionPayload>[]
          }
          upsert: {
            args: Prisma.PushSubscriptionUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$PushSubscriptionPayload>
          }
          aggregate: {
            args: Prisma.PushSubscriptionAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregatePushSubscription>
          }
          groupBy: {
            args: Prisma.PushSubscriptionGroupByArgs<ExtArgs>
            result: $Utils.Optional<PushSubscriptionGroupByOutputType>[]
          }
          count: {
            args: Prisma.PushSubscriptionCountArgs<ExtArgs>
            result: $Utils.Optional<PushSubscriptionCountAggregateOutputType> | number
          }
        }
      }
      Deposit: {
        payload: Prisma.$DepositPayload<ExtArgs>
        fields: Prisma.DepositFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DepositFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DepositFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositPayload>
          }
          findFirst: {
            args: Prisma.DepositFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DepositFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositPayload>
          }
          findMany: {
            args: Prisma.DepositFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositPayload>[]
          }
          create: {
            args: Prisma.DepositCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositPayload>
          }
          createMany: {
            args: Prisma.DepositCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DepositCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositPayload>[]
          }
          delete: {
            args: Prisma.DepositDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositPayload>
          }
          update: {
            args: Prisma.DepositUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositPayload>
          }
          deleteMany: {
            args: Prisma.DepositDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DepositUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DepositUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositPayload>[]
          }
          upsert: {
            args: Prisma.DepositUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositPayload>
          }
          aggregate: {
            args: Prisma.DepositAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDeposit>
          }
          groupBy: {
            args: Prisma.DepositGroupByArgs<ExtArgs>
            result: $Utils.Optional<DepositGroupByOutputType>[]
          }
          count: {
            args: Prisma.DepositCountArgs<ExtArgs>
            result: $Utils.Optional<DepositCountAggregateOutputType> | number
          }
        }
      }
      DepositScan: {
        payload: Prisma.$DepositScanPayload<ExtArgs>
        fields: Prisma.DepositScanFieldRefs
        operations: {
          findUnique: {
            args: Prisma.DepositScanFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositScanPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.DepositScanFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositScanPayload>
          }
          findFirst: {
            args: Prisma.DepositScanFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositScanPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.DepositScanFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositScanPayload>
          }
          findMany: {
            args: Prisma.DepositScanFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositScanPayload>[]
          }
          create: {
            args: Prisma.DepositScanCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositScanPayload>
          }
          createMany: {
            args: Prisma.DepositScanCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.DepositScanCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositScanPayload>[]
          }
          delete: {
            args: Prisma.DepositScanDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositScanPayload>
          }
          update: {
            args: Prisma.DepositScanUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositScanPayload>
          }
          deleteMany: {
            args: Prisma.DepositScanDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.DepositScanUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.DepositScanUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositScanPayload>[]
          }
          upsert: {
            args: Prisma.DepositScanUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$DepositScanPayload>
          }
          aggregate: {
            args: Prisma.DepositScanAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateDepositScan>
          }
          groupBy: {
            args: Prisma.DepositScanGroupByArgs<ExtArgs>
            result: $Utils.Optional<DepositScanGroupByOutputType>[]
          }
          count: {
            args: Prisma.DepositScanCountArgs<ExtArgs>
            result: $Utils.Optional<DepositScanCountAggregateOutputType> | number
          }
        }
      }
      Withdrawal: {
        payload: Prisma.$WithdrawalPayload<ExtArgs>
        fields: Prisma.WithdrawalFieldRefs
        operations: {
          findUnique: {
            args: Prisma.WithdrawalFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WithdrawalPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.WithdrawalFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WithdrawalPayload>
          }
          findFirst: {
            args: Prisma.WithdrawalFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WithdrawalPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.WithdrawalFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WithdrawalPayload>
          }
          findMany: {
            args: Prisma.WithdrawalFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WithdrawalPayload>[]
          }
          create: {
            args: Prisma.WithdrawalCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WithdrawalPayload>
          }
          createMany: {
            args: Prisma.WithdrawalCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.WithdrawalCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WithdrawalPayload>[]
          }
          delete: {
            args: Prisma.WithdrawalDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WithdrawalPayload>
          }
          update: {
            args: Prisma.WithdrawalUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WithdrawalPayload>
          }
          deleteMany: {
            args: Prisma.WithdrawalDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.WithdrawalUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.WithdrawalUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WithdrawalPayload>[]
          }
          upsert: {
            args: Prisma.WithdrawalUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$WithdrawalPayload>
          }
          aggregate: {
            args: Prisma.WithdrawalAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateWithdrawal>
          }
          groupBy: {
            args: Prisma.WithdrawalGroupByArgs<ExtArgs>
            result: $Utils.Optional<WithdrawalGroupByOutputType>[]
          }
          count: {
            args: Prisma.WithdrawalCountArgs<ExtArgs>
            result: $Utils.Optional<WithdrawalCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Shorthand for `emit: 'stdout'`
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events only
     * log: [
     *   { emit: 'event', level: 'query' },
     *   { emit: 'event', level: 'info' },
     *   { emit: 'event', level: 'warn' }
     *   { emit: 'event', level: 'error' }
     * ]
     * 
     * / Emit as events and log to stdout
     * og: [
     *  { emit: 'stdout', level: 'query' },
     *  { emit: 'stdout', level: 'info' },
     *  { emit: 'stdout', level: 'warn' }
     *  { emit: 'stdout', level: 'error' }
     * 
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Instance of a Driver Adapter, e.g., like one provided by `@prisma/adapter-planetscale`
     */
    adapter?: runtime.SqlDriverAdapterFactory | null
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    profile?: ProfileOmit
    coin?: CoinOmit
    holding?: HoldingOmit
    transaction?: TransactionOmit
    candle?: CandleOmit
    referralAccount?: ReferralAccountOmit
    treasuryEvent?: TreasuryEventOmit
    auditLog?: AuditLogOmit
    indexerState?: IndexerStateOmit
    pendingTx?: PendingTxOmit
    pushSubscription?: PushSubscriptionOmit
    deposit?: DepositOmit
    depositScan?: DepositScanOmit
    withdrawal?: WithdrawalOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type CheckIsLogLevel<T> = T extends LogLevel ? T : never;

  export type GetLogType<T> = CheckIsLogLevel<
    T extends LogDefinition ? T['level'] : T
  >;

  export type GetEvents<T extends any[]> = T extends Array<LogLevel | LogDefinition>
    ? GetLogType<T[number]>
    : never;

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type ProfileCountOutputType
   */

  export type ProfileCountOutputType = {
    coins: number
    transactions: number
    holdings: number
  }

  export type ProfileCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    coins?: boolean | ProfileCountOutputTypeCountCoinsArgs
    transactions?: boolean | ProfileCountOutputTypeCountTransactionsArgs
    holdings?: boolean | ProfileCountOutputTypeCountHoldingsArgs
  }

  // Custom InputTypes
  /**
   * ProfileCountOutputType without action
   */
  export type ProfileCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ProfileCountOutputType
     */
    select?: ProfileCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * ProfileCountOutputType without action
   */
  export type ProfileCountOutputTypeCountCoinsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CoinWhereInput
  }

  /**
   * ProfileCountOutputType without action
   */
  export type ProfileCountOutputTypeCountTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
  }

  /**
   * ProfileCountOutputType without action
   */
  export type ProfileCountOutputTypeCountHoldingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HoldingWhereInput
  }


  /**
   * Count Type CoinCountOutputType
   */

  export type CoinCountOutputType = {
    transactions: number
    holdings: number
    candles: number
  }

  export type CoinCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    transactions?: boolean | CoinCountOutputTypeCountTransactionsArgs
    holdings?: boolean | CoinCountOutputTypeCountHoldingsArgs
    candles?: boolean | CoinCountOutputTypeCountCandlesArgs
  }

  // Custom InputTypes
  /**
   * CoinCountOutputType without action
   */
  export type CoinCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the CoinCountOutputType
     */
    select?: CoinCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * CoinCountOutputType without action
   */
  export type CoinCountOutputTypeCountTransactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
  }

  /**
   * CoinCountOutputType without action
   */
  export type CoinCountOutputTypeCountHoldingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HoldingWhereInput
  }

  /**
   * CoinCountOutputType without action
   */
  export type CoinCountOutputTypeCountCandlesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CandleWhereInput
  }


  /**
   * Models
   */

  /**
   * Model Profile
   */

  export type AggregateProfile = {
    _count: ProfileCountAggregateOutputType | null
    _avg: ProfileAvgAggregateOutputType | null
    _sum: ProfileSumAggregateOutputType | null
    _min: ProfileMinAggregateOutputType | null
    _max: ProfileMaxAggregateOutputType | null
  }

  export type ProfileAvgAggregateOutputType = {
    runBalanceSol: Decimal | null
    creatorRewardsSol: Decimal | null
    referralRewardsSol: Decimal | null
    ownerRewardsSol: Decimal | null
  }

  export type ProfileSumAggregateOutputType = {
    runBalanceSol: Decimal | null
    creatorRewardsSol: Decimal | null
    referralRewardsSol: Decimal | null
    ownerRewardsSol: Decimal | null
  }

  export type ProfileMinAggregateOutputType = {
    id: string | null
    walletAddress: string | null
    privyUserId: string | null
    role: $Enums.UserRole | null
    referrerWallet: string | null
    encryptedMnemonic: string | null
    mnemonicIv: string | null
    mnemonicTag: string | null
    isBanned: boolean | null
    runBalanceSol: Decimal | null
    creatorRewardsSol: Decimal | null
    referralRewardsSol: Decimal | null
    ownerRewardsSol: Decimal | null
    createdAt: Date | null
    updatedAt: Date | null
    lastSeenAt: Date | null
  }

  export type ProfileMaxAggregateOutputType = {
    id: string | null
    walletAddress: string | null
    privyUserId: string | null
    role: $Enums.UserRole | null
    referrerWallet: string | null
    encryptedMnemonic: string | null
    mnemonicIv: string | null
    mnemonicTag: string | null
    isBanned: boolean | null
    runBalanceSol: Decimal | null
    creatorRewardsSol: Decimal | null
    referralRewardsSol: Decimal | null
    ownerRewardsSol: Decimal | null
    createdAt: Date | null
    updatedAt: Date | null
    lastSeenAt: Date | null
  }

  export type ProfileCountAggregateOutputType = {
    id: number
    walletAddress: number
    privyUserId: number
    role: number
    referrerWallet: number
    encryptedMnemonic: number
    mnemonicIv: number
    mnemonicTag: number
    isBanned: number
    runBalanceSol: number
    creatorRewardsSol: number
    referralRewardsSol: number
    ownerRewardsSol: number
    createdAt: number
    updatedAt: number
    lastSeenAt: number
    _all: number
  }


  export type ProfileAvgAggregateInputType = {
    runBalanceSol?: true
    creatorRewardsSol?: true
    referralRewardsSol?: true
    ownerRewardsSol?: true
  }

  export type ProfileSumAggregateInputType = {
    runBalanceSol?: true
    creatorRewardsSol?: true
    referralRewardsSol?: true
    ownerRewardsSol?: true
  }

  export type ProfileMinAggregateInputType = {
    id?: true
    walletAddress?: true
    privyUserId?: true
    role?: true
    referrerWallet?: true
    encryptedMnemonic?: true
    mnemonicIv?: true
    mnemonicTag?: true
    isBanned?: true
    runBalanceSol?: true
    creatorRewardsSol?: true
    referralRewardsSol?: true
    ownerRewardsSol?: true
    createdAt?: true
    updatedAt?: true
    lastSeenAt?: true
  }

  export type ProfileMaxAggregateInputType = {
    id?: true
    walletAddress?: true
    privyUserId?: true
    role?: true
    referrerWallet?: true
    encryptedMnemonic?: true
    mnemonicIv?: true
    mnemonicTag?: true
    isBanned?: true
    runBalanceSol?: true
    creatorRewardsSol?: true
    referralRewardsSol?: true
    ownerRewardsSol?: true
    createdAt?: true
    updatedAt?: true
    lastSeenAt?: true
  }

  export type ProfileCountAggregateInputType = {
    id?: true
    walletAddress?: true
    privyUserId?: true
    role?: true
    referrerWallet?: true
    encryptedMnemonic?: true
    mnemonicIv?: true
    mnemonicTag?: true
    isBanned?: true
    runBalanceSol?: true
    creatorRewardsSol?: true
    referralRewardsSol?: true
    ownerRewardsSol?: true
    createdAt?: true
    updatedAt?: true
    lastSeenAt?: true
    _all?: true
  }

  export type ProfileAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Profile to aggregate.
     */
    where?: ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Profiles to fetch.
     */
    orderBy?: ProfileOrderByWithRelationInput | ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Profiles
    **/
    _count?: true | ProfileCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ProfileAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ProfileSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ProfileMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ProfileMaxAggregateInputType
  }

  export type GetProfileAggregateType<T extends ProfileAggregateArgs> = {
        [P in keyof T & keyof AggregateProfile]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateProfile[P]>
      : GetScalarType<T[P], AggregateProfile[P]>
  }




  export type ProfileGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ProfileWhereInput
    orderBy?: ProfileOrderByWithAggregationInput | ProfileOrderByWithAggregationInput[]
    by: ProfileScalarFieldEnum[] | ProfileScalarFieldEnum
    having?: ProfileScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ProfileCountAggregateInputType | true
    _avg?: ProfileAvgAggregateInputType
    _sum?: ProfileSumAggregateInputType
    _min?: ProfileMinAggregateInputType
    _max?: ProfileMaxAggregateInputType
  }

  export type ProfileGroupByOutputType = {
    id: string
    walletAddress: string
    privyUserId: string
    role: $Enums.UserRole
    referrerWallet: string | null
    encryptedMnemonic: string | null
    mnemonicIv: string | null
    mnemonicTag: string | null
    isBanned: boolean
    runBalanceSol: Decimal
    creatorRewardsSol: Decimal
    referralRewardsSol: Decimal
    ownerRewardsSol: Decimal
    createdAt: Date
    updatedAt: Date
    lastSeenAt: Date | null
    _count: ProfileCountAggregateOutputType | null
    _avg: ProfileAvgAggregateOutputType | null
    _sum: ProfileSumAggregateOutputType | null
    _min: ProfileMinAggregateOutputType | null
    _max: ProfileMaxAggregateOutputType | null
  }

  type GetProfileGroupByPayload<T extends ProfileGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ProfileGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ProfileGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ProfileGroupByOutputType[P]>
            : GetScalarType<T[P], ProfileGroupByOutputType[P]>
        }
      >
    >


  export type ProfileSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    privyUserId?: boolean
    role?: boolean
    referrerWallet?: boolean
    encryptedMnemonic?: boolean
    mnemonicIv?: boolean
    mnemonicTag?: boolean
    isBanned?: boolean
    runBalanceSol?: boolean
    creatorRewardsSol?: boolean
    referralRewardsSol?: boolean
    ownerRewardsSol?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastSeenAt?: boolean
    coins?: boolean | Profile$coinsArgs<ExtArgs>
    transactions?: boolean | Profile$transactionsArgs<ExtArgs>
    holdings?: boolean | Profile$holdingsArgs<ExtArgs>
    _count?: boolean | ProfileCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["profile"]>

  export type ProfileSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    privyUserId?: boolean
    role?: boolean
    referrerWallet?: boolean
    encryptedMnemonic?: boolean
    mnemonicIv?: boolean
    mnemonicTag?: boolean
    isBanned?: boolean
    runBalanceSol?: boolean
    creatorRewardsSol?: boolean
    referralRewardsSol?: boolean
    ownerRewardsSol?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastSeenAt?: boolean
  }, ExtArgs["result"]["profile"]>

  export type ProfileSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    privyUserId?: boolean
    role?: boolean
    referrerWallet?: boolean
    encryptedMnemonic?: boolean
    mnemonicIv?: boolean
    mnemonicTag?: boolean
    isBanned?: boolean
    runBalanceSol?: boolean
    creatorRewardsSol?: boolean
    referralRewardsSol?: boolean
    ownerRewardsSol?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastSeenAt?: boolean
  }, ExtArgs["result"]["profile"]>

  export type ProfileSelectScalar = {
    id?: boolean
    walletAddress?: boolean
    privyUserId?: boolean
    role?: boolean
    referrerWallet?: boolean
    encryptedMnemonic?: boolean
    mnemonicIv?: boolean
    mnemonicTag?: boolean
    isBanned?: boolean
    runBalanceSol?: boolean
    creatorRewardsSol?: boolean
    referralRewardsSol?: boolean
    ownerRewardsSol?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    lastSeenAt?: boolean
  }

  export type ProfileOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "walletAddress" | "privyUserId" | "role" | "referrerWallet" | "encryptedMnemonic" | "mnemonicIv" | "mnemonicTag" | "isBanned" | "runBalanceSol" | "creatorRewardsSol" | "referralRewardsSol" | "ownerRewardsSol" | "createdAt" | "updatedAt" | "lastSeenAt", ExtArgs["result"]["profile"]>
  export type ProfileInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    coins?: boolean | Profile$coinsArgs<ExtArgs>
    transactions?: boolean | Profile$transactionsArgs<ExtArgs>
    holdings?: boolean | Profile$holdingsArgs<ExtArgs>
    _count?: boolean | ProfileCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type ProfileIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type ProfileIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $ProfilePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Profile"
    objects: {
      coins: Prisma.$CoinPayload<ExtArgs>[]
      transactions: Prisma.$TransactionPayload<ExtArgs>[]
      holdings: Prisma.$HoldingPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      walletAddress: string
      privyUserId: string
      role: $Enums.UserRole
      referrerWallet: string | null
      encryptedMnemonic: string | null
      mnemonicIv: string | null
      mnemonicTag: string | null
      isBanned: boolean
      /**
       * Spendable SOL balance (legacy run_balance parity — Sprint 7).
       */
      runBalanceSol: Prisma.Decimal
      creatorRewardsSol: Prisma.Decimal
      referralRewardsSol: Prisma.Decimal
      ownerRewardsSol: Prisma.Decimal
      createdAt: Date
      updatedAt: Date
      lastSeenAt: Date | null
    }, ExtArgs["result"]["profile"]>
    composites: {}
  }

  type ProfileGetPayload<S extends boolean | null | undefined | ProfileDefaultArgs> = $Result.GetResult<Prisma.$ProfilePayload, S>

  type ProfileCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ProfileFindManyArgs, 'select' | 'include' | 'distinct' | 'omit' | 'relationLoadStrategy'> & {
      select?: ProfileCountAggregateInputType | true
    }

  export interface ProfileDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Profile'], meta: { name: 'Profile' } }
    /**
     * Find zero or one Profile that matches the filter.
     * @param {ProfileFindUniqueArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ProfileFindUniqueArgs>(args: SelectSubset<T, ProfileFindUniqueArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Profile that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ProfileFindUniqueOrThrowArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ProfileFindUniqueOrThrowArgs>(args: SelectSubset<T, ProfileFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Profile that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileFindFirstArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ProfileFindFirstArgs>(args?: SelectSubset<T, ProfileFindFirstArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Profile that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileFindFirstOrThrowArgs} args - Arguments to find a Profile
     * @example
     * // Get one Profile
     * const profile = await prisma.profile.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ProfileFindFirstOrThrowArgs>(args?: SelectSubset<T, ProfileFindFirstOrThrowArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Profiles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Profiles
     * const profiles = await prisma.profile.findMany()
     * 
     * // Get first 10 Profiles
     * const profiles = await prisma.profile.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const profileWithIdOnly = await prisma.profile.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ProfileFindManyArgs>(args?: SelectSubset<T, ProfileFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Profile.
     * @param {ProfileCreateArgs} args - Arguments to create a Profile.
     * @example
     * // Create one Profile
     * const Profile = await prisma.profile.create({
     *   data: {
     *     // ... data to create a Profile
     *   }
     * })
     * 
     */
    create<T extends ProfileCreateArgs>(args: SelectSubset<T, ProfileCreateArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Profiles.
     * @param {ProfileCreateManyArgs} args - Arguments to create many Profiles.
     * @example
     * // Create many Profiles
     * const profile = await prisma.profile.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ProfileCreateManyArgs>(args?: SelectSubset<T, ProfileCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Profiles and returns the data saved in the database.
     * @param {ProfileCreateManyAndReturnArgs} args - Arguments to create many Profiles.
     * @example
     * // Create many Profiles
     * const profile = await prisma.profile.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Profiles and only return the `id`
     * const profileWithIdOnly = await prisma.profile.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ProfileCreateManyAndReturnArgs>(args?: SelectSubset<T, ProfileCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Profile.
     * @param {ProfileDeleteArgs} args - Arguments to delete one Profile.
     * @example
     * // Delete one Profile
     * const Profile = await prisma.profile.delete({
     *   where: {
     *     // ... filter to delete one Profile
     *   }
     * })
     * 
     */
    delete<T extends ProfileDeleteArgs>(args: SelectSubset<T, ProfileDeleteArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Profile.
     * @param {ProfileUpdateArgs} args - Arguments to update one Profile.
     * @example
     * // Update one Profile
     * const profile = await prisma.profile.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ProfileUpdateArgs>(args: SelectSubset<T, ProfileUpdateArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Profiles.
     * @param {ProfileDeleteManyArgs} args - Arguments to filter Profiles to delete.
     * @example
     * // Delete a few Profiles
     * const { count } = await prisma.profile.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ProfileDeleteManyArgs>(args?: SelectSubset<T, ProfileDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Profiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Profiles
     * const profile = await prisma.profile.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ProfileUpdateManyArgs>(args: SelectSubset<T, ProfileUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Profiles and returns the data updated in the database.
     * @param {ProfileUpdateManyAndReturnArgs} args - Arguments to update many Profiles.
     * @example
     * // Update many Profiles
     * const profile = await prisma.profile.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Profiles and only return the `id`
     * const profileWithIdOnly = await prisma.profile.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ProfileUpdateManyAndReturnArgs>(args: SelectSubset<T, ProfileUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Profile.
     * @param {ProfileUpsertArgs} args - Arguments to update or create a Profile.
     * @example
     * // Update or create a Profile
     * const profile = await prisma.profile.upsert({
     *   create: {
     *     // ... data to create a Profile
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Profile we want to update
     *   }
     * })
     */
    upsert<T extends ProfileUpsertArgs>(args: SelectSubset<T, ProfileUpsertArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Profiles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileCountArgs} args - Arguments to filter Profiles to count.
     * @example
     * // Count the number of Profiles
     * const count = await prisma.profile.count({
     *   where: {
     *     // ... the filter for the Profiles we want to count
     *   }
     * })
    **/
    count<T extends ProfileCountArgs>(
      args?: Subset<T, ProfileCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ProfileCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Profile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ProfileAggregateArgs>(args: Subset<T, ProfileAggregateArgs>): Prisma.PrismaPromise<GetProfileAggregateType<T>>

    /**
     * Group by Profile.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ProfileGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ProfileGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ProfileGroupByArgs['orderBy'] }
        : { orderBy?: ProfileGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ProfileGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetProfileGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Profile model
   */
  readonly fields: ProfileFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Profile.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ProfileClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    coins<T extends Profile$coinsArgs<ExtArgs> = {}>(args?: Subset<T, Profile$coinsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    transactions<T extends Profile$transactionsArgs<ExtArgs> = {}>(args?: Subset<T, Profile$transactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    holdings<T extends Profile$holdingsArgs<ExtArgs> = {}>(args?: Subset<T, Profile$holdingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HoldingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Profile model
   */
  interface ProfileFieldRefs {
    readonly id: FieldRef<"Profile", 'String'>
    readonly walletAddress: FieldRef<"Profile", 'String'>
    readonly privyUserId: FieldRef<"Profile", 'String'>
    readonly role: FieldRef<"Profile", 'UserRole'>
    readonly referrerWallet: FieldRef<"Profile", 'String'>
    readonly encryptedMnemonic: FieldRef<"Profile", 'String'>
    readonly mnemonicIv: FieldRef<"Profile", 'String'>
    readonly mnemonicTag: FieldRef<"Profile", 'String'>
    readonly isBanned: FieldRef<"Profile", 'Boolean'>
    readonly runBalanceSol: FieldRef<"Profile", 'Decimal'>
    readonly creatorRewardsSol: FieldRef<"Profile", 'Decimal'>
    readonly referralRewardsSol: FieldRef<"Profile", 'Decimal'>
    readonly ownerRewardsSol: FieldRef<"Profile", 'Decimal'>
    readonly createdAt: FieldRef<"Profile", 'DateTime'>
    readonly updatedAt: FieldRef<"Profile", 'DateTime'>
    readonly lastSeenAt: FieldRef<"Profile", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Profile findUnique
   */
  export type ProfileFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Profile to fetch.
     */
    where: ProfileWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Profile findUniqueOrThrow
   */
  export type ProfileFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Profile to fetch.
     */
    where: ProfileWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Profile findFirst
   */
  export type ProfileFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Profile to fetch.
     */
    where?: ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Profiles to fetch.
     */
    orderBy?: ProfileOrderByWithRelationInput | ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Profiles.
     */
    cursor?: ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Profiles.
     */
    distinct?: ProfileScalarFieldEnum | ProfileScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Profile findFirstOrThrow
   */
  export type ProfileFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Profile to fetch.
     */
    where?: ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Profiles to fetch.
     */
    orderBy?: ProfileOrderByWithRelationInput | ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Profiles.
     */
    cursor?: ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Profiles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Profiles.
     */
    distinct?: ProfileScalarFieldEnum | ProfileScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Profile findMany
   */
  export type ProfileFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * Filter, which Profiles to fetch.
     */
    where?: ProfileWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Profiles to fetch.
     */
    orderBy?: ProfileOrderByWithRelationInput | ProfileOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Profiles.
     */
    cursor?: ProfileWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Profiles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Profiles.
     */
    skip?: number
    distinct?: ProfileScalarFieldEnum | ProfileScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Profile create
   */
  export type ProfileCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * The data needed to create a Profile.
     */
    data: XOR<ProfileCreateInput, ProfileUncheckedCreateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Profile createMany
   */
  export type ProfileCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Profiles.
     */
    data: ProfileCreateManyInput | ProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Profile createManyAndReturn
   */
  export type ProfileCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * The data used to create many Profiles.
     */
    data: ProfileCreateManyInput | ProfileCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Profile update
   */
  export type ProfileUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * The data needed to update a Profile.
     */
    data: XOR<ProfileUpdateInput, ProfileUncheckedUpdateInput>
    /**
     * Choose, which Profile to update.
     */
    where: ProfileWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Profile updateMany
   */
  export type ProfileUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Profiles.
     */
    data: XOR<ProfileUpdateManyMutationInput, ProfileUncheckedUpdateManyInput>
    /**
     * Filter which Profiles to update
     */
    where?: ProfileWhereInput
    /**
     * Limit how many Profiles to update.
     */
    limit?: number
  }

  /**
   * Profile updateManyAndReturn
   */
  export type ProfileUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * The data used to update Profiles.
     */
    data: XOR<ProfileUpdateManyMutationInput, ProfileUncheckedUpdateManyInput>
    /**
     * Filter which Profiles to update
     */
    where?: ProfileWhereInput
    /**
     * Limit how many Profiles to update.
     */
    limit?: number
  }

  /**
   * Profile upsert
   */
  export type ProfileUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * The filter to search for the Profile to update in case it exists.
     */
    where: ProfileWhereUniqueInput
    /**
     * In case the Profile found by the `where` argument doesn't exist, create a new Profile with this data.
     */
    create: XOR<ProfileCreateInput, ProfileUncheckedCreateInput>
    /**
     * In case the Profile was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ProfileUpdateInput, ProfileUncheckedUpdateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Profile delete
   */
  export type ProfileDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
    /**
     * Filter which Profile to delete.
     */
    where: ProfileWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Profile deleteMany
   */
  export type ProfileDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Profiles to delete
     */
    where?: ProfileWhereInput
    /**
     * Limit how many Profiles to delete.
     */
    limit?: number
  }

  /**
   * Profile.coins
   */
  export type Profile$coinsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Coin
     */
    select?: CoinSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Coin
     */
    omit?: CoinOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoinInclude<ExtArgs> | null
    where?: CoinWhereInput
    orderBy?: CoinOrderByWithRelationInput | CoinOrderByWithRelationInput[]
    cursor?: CoinWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CoinScalarFieldEnum | CoinScalarFieldEnum[]
  }

  /**
   * Profile.transactions
   */
  export type Profile$transactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    cursor?: TransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Profile.holdings
   */
  export type Profile$holdingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Holding
     */
    select?: HoldingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Holding
     */
    omit?: HoldingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoldingInclude<ExtArgs> | null
    where?: HoldingWhereInput
    orderBy?: HoldingOrderByWithRelationInput | HoldingOrderByWithRelationInput[]
    cursor?: HoldingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: HoldingScalarFieldEnum | HoldingScalarFieldEnum[]
  }

  /**
   * Profile without action
   */
  export type ProfileDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Profile
     */
    select?: ProfileSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Profile
     */
    omit?: ProfileOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: ProfileInclude<ExtArgs> | null
  }


  /**
   * Model Coin
   */

  export type AggregateCoin = {
    _count: CoinCountAggregateOutputType | null
    _avg: CoinAvgAggregateOutputType | null
    _sum: CoinSumAggregateOutputType | null
    _min: CoinMinAggregateOutputType | null
    _max: CoinMaxAggregateOutputType | null
  }

  export type CoinAvgAggregateOutputType = {
    version: number | null
    virtualSolReserves: Decimal | null
    virtualTokenReserves: Decimal | null
    realSolReserves: Decimal | null
    realTokenReserves: Decimal | null
    totalFeesCollected: Decimal | null
    creatorFeeSnapshot: Decimal | null
    referrerFeeSnapshot: Decimal | null
  }

  export type CoinSumAggregateOutputType = {
    version: number | null
    virtualSolReserves: Decimal | null
    virtualTokenReserves: Decimal | null
    realSolReserves: Decimal | null
    realTokenReserves: Decimal | null
    totalFeesCollected: Decimal | null
    creatorFeeSnapshot: Decimal | null
    referrerFeeSnapshot: Decimal | null
  }

  export type CoinMinAggregateOutputType = {
    id: string | null
    mintAddress: string | null
    creatorWallet: string | null
    name: string | null
    symbol: string | null
    description: string | null
    imageUri: string | null
    metadataUri: string | null
    status: $Enums.CoinStatus | null
    version: number | null
    virtualSolReserves: Decimal | null
    virtualTokenReserves: Decimal | null
    realSolReserves: Decimal | null
    realTokenReserves: Decimal | null
    totalFeesCollected: Decimal | null
    creatorFeeSnapshot: Decimal | null
    referrerFeeSnapshot: Decimal | null
    referrerWallet: string | null
    graduationInitiatedAt: Date | null
    graduationCompletedAt: Date | null
    raydiumPoolAddress: string | null
    lpMintAddress: string | null
    lpTokensBurned: boolean | null
    mintAuthorityRevoked: boolean | null
    freezeAuthorityRevoked: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CoinMaxAggregateOutputType = {
    id: string | null
    mintAddress: string | null
    creatorWallet: string | null
    name: string | null
    symbol: string | null
    description: string | null
    imageUri: string | null
    metadataUri: string | null
    status: $Enums.CoinStatus | null
    version: number | null
    virtualSolReserves: Decimal | null
    virtualTokenReserves: Decimal | null
    realSolReserves: Decimal | null
    realTokenReserves: Decimal | null
    totalFeesCollected: Decimal | null
    creatorFeeSnapshot: Decimal | null
    referrerFeeSnapshot: Decimal | null
    referrerWallet: string | null
    graduationInitiatedAt: Date | null
    graduationCompletedAt: Date | null
    raydiumPoolAddress: string | null
    lpMintAddress: string | null
    lpTokensBurned: boolean | null
    mintAuthorityRevoked: boolean | null
    freezeAuthorityRevoked: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type CoinCountAggregateOutputType = {
    id: number
    mintAddress: number
    creatorWallet: number
    name: number
    symbol: number
    description: number
    imageUri: number
    metadataUri: number
    status: number
    version: number
    virtualSolReserves: number
    virtualTokenReserves: number
    realSolReserves: number
    realTokenReserves: number
    totalFeesCollected: number
    creatorFeeSnapshot: number
    referrerFeeSnapshot: number
    referrerWallet: number
    graduationInitiatedAt: number
    graduationCompletedAt: number
    raydiumPoolAddress: number
    lpMintAddress: number
    lpTokensBurned: number
    mintAuthorityRevoked: number
    freezeAuthorityRevoked: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type CoinAvgAggregateInputType = {
    version?: true
    virtualSolReserves?: true
    virtualTokenReserves?: true
    realSolReserves?: true
    realTokenReserves?: true
    totalFeesCollected?: true
    creatorFeeSnapshot?: true
    referrerFeeSnapshot?: true
  }

  export type CoinSumAggregateInputType = {
    version?: true
    virtualSolReserves?: true
    virtualTokenReserves?: true
    realSolReserves?: true
    realTokenReserves?: true
    totalFeesCollected?: true
    creatorFeeSnapshot?: true
    referrerFeeSnapshot?: true
  }

  export type CoinMinAggregateInputType = {
    id?: true
    mintAddress?: true
    creatorWallet?: true
    name?: true
    symbol?: true
    description?: true
    imageUri?: true
    metadataUri?: true
    status?: true
    version?: true
    virtualSolReserves?: true
    virtualTokenReserves?: true
    realSolReserves?: true
    realTokenReserves?: true
    totalFeesCollected?: true
    creatorFeeSnapshot?: true
    referrerFeeSnapshot?: true
    referrerWallet?: true
    graduationInitiatedAt?: true
    graduationCompletedAt?: true
    raydiumPoolAddress?: true
    lpMintAddress?: true
    lpTokensBurned?: true
    mintAuthorityRevoked?: true
    freezeAuthorityRevoked?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CoinMaxAggregateInputType = {
    id?: true
    mintAddress?: true
    creatorWallet?: true
    name?: true
    symbol?: true
    description?: true
    imageUri?: true
    metadataUri?: true
    status?: true
    version?: true
    virtualSolReserves?: true
    virtualTokenReserves?: true
    realSolReserves?: true
    realTokenReserves?: true
    totalFeesCollected?: true
    creatorFeeSnapshot?: true
    referrerFeeSnapshot?: true
    referrerWallet?: true
    graduationInitiatedAt?: true
    graduationCompletedAt?: true
    raydiumPoolAddress?: true
    lpMintAddress?: true
    lpTokensBurned?: true
    mintAuthorityRevoked?: true
    freezeAuthorityRevoked?: true
    createdAt?: true
    updatedAt?: true
  }

  export type CoinCountAggregateInputType = {
    id?: true
    mintAddress?: true
    creatorWallet?: true
    name?: true
    symbol?: true
    description?: true
    imageUri?: true
    metadataUri?: true
    status?: true
    version?: true
    virtualSolReserves?: true
    virtualTokenReserves?: true
    realSolReserves?: true
    realTokenReserves?: true
    totalFeesCollected?: true
    creatorFeeSnapshot?: true
    referrerFeeSnapshot?: true
    referrerWallet?: true
    graduationInitiatedAt?: true
    graduationCompletedAt?: true
    raydiumPoolAddress?: true
    lpMintAddress?: true
    lpTokensBurned?: true
    mintAuthorityRevoked?: true
    freezeAuthorityRevoked?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type CoinAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Coin to aggregate.
     */
    where?: CoinWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Coins to fetch.
     */
    orderBy?: CoinOrderByWithRelationInput | CoinOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CoinWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Coins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Coins.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Coins
    **/
    _count?: true | CoinCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CoinAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CoinSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CoinMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CoinMaxAggregateInputType
  }

  export type GetCoinAggregateType<T extends CoinAggregateArgs> = {
        [P in keyof T & keyof AggregateCoin]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCoin[P]>
      : GetScalarType<T[P], AggregateCoin[P]>
  }




  export type CoinGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CoinWhereInput
    orderBy?: CoinOrderByWithAggregationInput | CoinOrderByWithAggregationInput[]
    by: CoinScalarFieldEnum[] | CoinScalarFieldEnum
    having?: CoinScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CoinCountAggregateInputType | true
    _avg?: CoinAvgAggregateInputType
    _sum?: CoinSumAggregateInputType
    _min?: CoinMinAggregateInputType
    _max?: CoinMaxAggregateInputType
  }

  export type CoinGroupByOutputType = {
    id: string
    mintAddress: string
    creatorWallet: string
    name: string
    symbol: string
    description: string
    imageUri: string
    metadataUri: string | null
    status: $Enums.CoinStatus
    version: number
    virtualSolReserves: Decimal
    virtualTokenReserves: Decimal
    realSolReserves: Decimal
    realTokenReserves: Decimal
    totalFeesCollected: Decimal
    creatorFeeSnapshot: Decimal | null
    referrerFeeSnapshot: Decimal | null
    referrerWallet: string | null
    graduationInitiatedAt: Date | null
    graduationCompletedAt: Date | null
    raydiumPoolAddress: string | null
    lpMintAddress: string | null
    lpTokensBurned: boolean
    mintAuthorityRevoked: boolean
    freezeAuthorityRevoked: boolean
    createdAt: Date
    updatedAt: Date
    _count: CoinCountAggregateOutputType | null
    _avg: CoinAvgAggregateOutputType | null
    _sum: CoinSumAggregateOutputType | null
    _min: CoinMinAggregateOutputType | null
    _max: CoinMaxAggregateOutputType | null
  }

  type GetCoinGroupByPayload<T extends CoinGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CoinGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CoinGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CoinGroupByOutputType[P]>
            : GetScalarType<T[P], CoinGroupByOutputType[P]>
        }
      >
    >


  export type CoinSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    mintAddress?: boolean
    creatorWallet?: boolean
    name?: boolean
    symbol?: boolean
    description?: boolean
    imageUri?: boolean
    metadataUri?: boolean
    status?: boolean
    version?: boolean
    virtualSolReserves?: boolean
    virtualTokenReserves?: boolean
    realSolReserves?: boolean
    realTokenReserves?: boolean
    totalFeesCollected?: boolean
    creatorFeeSnapshot?: boolean
    referrerFeeSnapshot?: boolean
    referrerWallet?: boolean
    graduationInitiatedAt?: boolean
    graduationCompletedAt?: boolean
    raydiumPoolAddress?: boolean
    lpMintAddress?: boolean
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creator?: boolean | ProfileDefaultArgs<ExtArgs>
    transactions?: boolean | Coin$transactionsArgs<ExtArgs>
    holdings?: boolean | Coin$holdingsArgs<ExtArgs>
    candles?: boolean | Coin$candlesArgs<ExtArgs>
    _count?: boolean | CoinCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["coin"]>

  export type CoinSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    mintAddress?: boolean
    creatorWallet?: boolean
    name?: boolean
    symbol?: boolean
    description?: boolean
    imageUri?: boolean
    metadataUri?: boolean
    status?: boolean
    version?: boolean
    virtualSolReserves?: boolean
    virtualTokenReserves?: boolean
    realSolReserves?: boolean
    realTokenReserves?: boolean
    totalFeesCollected?: boolean
    creatorFeeSnapshot?: boolean
    referrerFeeSnapshot?: boolean
    referrerWallet?: boolean
    graduationInitiatedAt?: boolean
    graduationCompletedAt?: boolean
    raydiumPoolAddress?: boolean
    lpMintAddress?: boolean
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creator?: boolean | ProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["coin"]>

  export type CoinSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    mintAddress?: boolean
    creatorWallet?: boolean
    name?: boolean
    symbol?: boolean
    description?: boolean
    imageUri?: boolean
    metadataUri?: boolean
    status?: boolean
    version?: boolean
    virtualSolReserves?: boolean
    virtualTokenReserves?: boolean
    realSolReserves?: boolean
    realTokenReserves?: boolean
    totalFeesCollected?: boolean
    creatorFeeSnapshot?: boolean
    referrerFeeSnapshot?: boolean
    referrerWallet?: boolean
    graduationInitiatedAt?: boolean
    graduationCompletedAt?: boolean
    raydiumPoolAddress?: boolean
    lpMintAddress?: boolean
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    creator?: boolean | ProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["coin"]>

  export type CoinSelectScalar = {
    id?: boolean
    mintAddress?: boolean
    creatorWallet?: boolean
    name?: boolean
    symbol?: boolean
    description?: boolean
    imageUri?: boolean
    metadataUri?: boolean
    status?: boolean
    version?: boolean
    virtualSolReserves?: boolean
    virtualTokenReserves?: boolean
    realSolReserves?: boolean
    realTokenReserves?: boolean
    totalFeesCollected?: boolean
    creatorFeeSnapshot?: boolean
    referrerFeeSnapshot?: boolean
    referrerWallet?: boolean
    graduationInitiatedAt?: boolean
    graduationCompletedAt?: boolean
    raydiumPoolAddress?: boolean
    lpMintAddress?: boolean
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type CoinOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "mintAddress" | "creatorWallet" | "name" | "symbol" | "description" | "imageUri" | "metadataUri" | "status" | "version" | "virtualSolReserves" | "virtualTokenReserves" | "realSolReserves" | "realTokenReserves" | "totalFeesCollected" | "creatorFeeSnapshot" | "referrerFeeSnapshot" | "referrerWallet" | "graduationInitiatedAt" | "graduationCompletedAt" | "raydiumPoolAddress" | "lpMintAddress" | "lpTokensBurned" | "mintAuthorityRevoked" | "freezeAuthorityRevoked" | "createdAt" | "updatedAt", ExtArgs["result"]["coin"]>
  export type CoinInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | ProfileDefaultArgs<ExtArgs>
    transactions?: boolean | Coin$transactionsArgs<ExtArgs>
    holdings?: boolean | Coin$holdingsArgs<ExtArgs>
    candles?: boolean | Coin$candlesArgs<ExtArgs>
    _count?: boolean | CoinCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type CoinIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | ProfileDefaultArgs<ExtArgs>
  }
  export type CoinIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    creator?: boolean | ProfileDefaultArgs<ExtArgs>
  }

  export type $CoinPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Coin"
    objects: {
      creator: Prisma.$ProfilePayload<ExtArgs>
      transactions: Prisma.$TransactionPayload<ExtArgs>[]
      holdings: Prisma.$HoldingPayload<ExtArgs>[]
      candles: Prisma.$CandlePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      mintAddress: string
      creatorWallet: string
      name: string
      symbol: string
      description: string
      imageUri: string
      metadataUri: string | null
      status: $Enums.CoinStatus
      version: number
      virtualSolReserves: Prisma.Decimal
      virtualTokenReserves: Prisma.Decimal
      realSolReserves: Prisma.Decimal
      realTokenReserves: Prisma.Decimal
      totalFeesCollected: Prisma.Decimal
      creatorFeeSnapshot: Prisma.Decimal | null
      referrerFeeSnapshot: Prisma.Decimal | null
      referrerWallet: string | null
      graduationInitiatedAt: Date | null
      graduationCompletedAt: Date | null
      raydiumPoolAddress: string | null
      lpMintAddress: string | null
      lpTokensBurned: boolean
      mintAuthorityRevoked: boolean
      freezeAuthorityRevoked: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["coin"]>
    composites: {}
  }

  type CoinGetPayload<S extends boolean | null | undefined | CoinDefaultArgs> = $Result.GetResult<Prisma.$CoinPayload, S>

  type CoinCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CoinFindManyArgs, 'select' | 'include' | 'distinct' | 'omit' | 'relationLoadStrategy'> & {
      select?: CoinCountAggregateInputType | true
    }

  export interface CoinDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Coin'], meta: { name: 'Coin' } }
    /**
     * Find zero or one Coin that matches the filter.
     * @param {CoinFindUniqueArgs} args - Arguments to find a Coin
     * @example
     * // Get one Coin
     * const coin = await prisma.coin.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CoinFindUniqueArgs>(args: SelectSubset<T, CoinFindUniqueArgs<ExtArgs>>): Prisma__CoinClient<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Coin that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CoinFindUniqueOrThrowArgs} args - Arguments to find a Coin
     * @example
     * // Get one Coin
     * const coin = await prisma.coin.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CoinFindUniqueOrThrowArgs>(args: SelectSubset<T, CoinFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CoinClient<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Coin that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoinFindFirstArgs} args - Arguments to find a Coin
     * @example
     * // Get one Coin
     * const coin = await prisma.coin.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CoinFindFirstArgs>(args?: SelectSubset<T, CoinFindFirstArgs<ExtArgs>>): Prisma__CoinClient<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Coin that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoinFindFirstOrThrowArgs} args - Arguments to find a Coin
     * @example
     * // Get one Coin
     * const coin = await prisma.coin.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CoinFindFirstOrThrowArgs>(args?: SelectSubset<T, CoinFindFirstOrThrowArgs<ExtArgs>>): Prisma__CoinClient<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Coins that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoinFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Coins
     * const coins = await prisma.coin.findMany()
     * 
     * // Get first 10 Coins
     * const coins = await prisma.coin.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const coinWithIdOnly = await prisma.coin.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CoinFindManyArgs>(args?: SelectSubset<T, CoinFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Coin.
     * @param {CoinCreateArgs} args - Arguments to create a Coin.
     * @example
     * // Create one Coin
     * const Coin = await prisma.coin.create({
     *   data: {
     *     // ... data to create a Coin
     *   }
     * })
     * 
     */
    create<T extends CoinCreateArgs>(args: SelectSubset<T, CoinCreateArgs<ExtArgs>>): Prisma__CoinClient<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Coins.
     * @param {CoinCreateManyArgs} args - Arguments to create many Coins.
     * @example
     * // Create many Coins
     * const coin = await prisma.coin.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CoinCreateManyArgs>(args?: SelectSubset<T, CoinCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Coins and returns the data saved in the database.
     * @param {CoinCreateManyAndReturnArgs} args - Arguments to create many Coins.
     * @example
     * // Create many Coins
     * const coin = await prisma.coin.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Coins and only return the `id`
     * const coinWithIdOnly = await prisma.coin.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CoinCreateManyAndReturnArgs>(args?: SelectSubset<T, CoinCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Coin.
     * @param {CoinDeleteArgs} args - Arguments to delete one Coin.
     * @example
     * // Delete one Coin
     * const Coin = await prisma.coin.delete({
     *   where: {
     *     // ... filter to delete one Coin
     *   }
     * })
     * 
     */
    delete<T extends CoinDeleteArgs>(args: SelectSubset<T, CoinDeleteArgs<ExtArgs>>): Prisma__CoinClient<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Coin.
     * @param {CoinUpdateArgs} args - Arguments to update one Coin.
     * @example
     * // Update one Coin
     * const coin = await prisma.coin.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CoinUpdateArgs>(args: SelectSubset<T, CoinUpdateArgs<ExtArgs>>): Prisma__CoinClient<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Coins.
     * @param {CoinDeleteManyArgs} args - Arguments to filter Coins to delete.
     * @example
     * // Delete a few Coins
     * const { count } = await prisma.coin.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CoinDeleteManyArgs>(args?: SelectSubset<T, CoinDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Coins.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoinUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Coins
     * const coin = await prisma.coin.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CoinUpdateManyArgs>(args: SelectSubset<T, CoinUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Coins and returns the data updated in the database.
     * @param {CoinUpdateManyAndReturnArgs} args - Arguments to update many Coins.
     * @example
     * // Update many Coins
     * const coin = await prisma.coin.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Coins and only return the `id`
     * const coinWithIdOnly = await prisma.coin.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CoinUpdateManyAndReturnArgs>(args: SelectSubset<T, CoinUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Coin.
     * @param {CoinUpsertArgs} args - Arguments to update or create a Coin.
     * @example
     * // Update or create a Coin
     * const coin = await prisma.coin.upsert({
     *   create: {
     *     // ... data to create a Coin
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Coin we want to update
     *   }
     * })
     */
    upsert<T extends CoinUpsertArgs>(args: SelectSubset<T, CoinUpsertArgs<ExtArgs>>): Prisma__CoinClient<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Coins.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoinCountArgs} args - Arguments to filter Coins to count.
     * @example
     * // Count the number of Coins
     * const count = await prisma.coin.count({
     *   where: {
     *     // ... the filter for the Coins we want to count
     *   }
     * })
    **/
    count<T extends CoinCountArgs>(
      args?: Subset<T, CoinCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CoinCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Coin.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoinAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CoinAggregateArgs>(args: Subset<T, CoinAggregateArgs>): Prisma.PrismaPromise<GetCoinAggregateType<T>>

    /**
     * Group by Coin.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CoinGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CoinGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CoinGroupByArgs['orderBy'] }
        : { orderBy?: CoinGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CoinGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCoinGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Coin model
   */
  readonly fields: CoinFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Coin.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CoinClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    creator<T extends ProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProfileDefaultArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    transactions<T extends Coin$transactionsArgs<ExtArgs> = {}>(args?: Subset<T, Coin$transactionsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    holdings<T extends Coin$holdingsArgs<ExtArgs> = {}>(args?: Subset<T, Coin$holdingsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HoldingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    candles<T extends Coin$candlesArgs<ExtArgs> = {}>(args?: Subset<T, Coin$candlesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CandlePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Coin model
   */
  interface CoinFieldRefs {
    readonly id: FieldRef<"Coin", 'String'>
    readonly mintAddress: FieldRef<"Coin", 'String'>
    readonly creatorWallet: FieldRef<"Coin", 'String'>
    readonly name: FieldRef<"Coin", 'String'>
    readonly symbol: FieldRef<"Coin", 'String'>
    readonly description: FieldRef<"Coin", 'String'>
    readonly imageUri: FieldRef<"Coin", 'String'>
    readonly metadataUri: FieldRef<"Coin", 'String'>
    readonly status: FieldRef<"Coin", 'CoinStatus'>
    readonly version: FieldRef<"Coin", 'Int'>
    readonly virtualSolReserves: FieldRef<"Coin", 'Decimal'>
    readonly virtualTokenReserves: FieldRef<"Coin", 'Decimal'>
    readonly realSolReserves: FieldRef<"Coin", 'Decimal'>
    readonly realTokenReserves: FieldRef<"Coin", 'Decimal'>
    readonly totalFeesCollected: FieldRef<"Coin", 'Decimal'>
    readonly creatorFeeSnapshot: FieldRef<"Coin", 'Decimal'>
    readonly referrerFeeSnapshot: FieldRef<"Coin", 'Decimal'>
    readonly referrerWallet: FieldRef<"Coin", 'String'>
    readonly graduationInitiatedAt: FieldRef<"Coin", 'DateTime'>
    readonly graduationCompletedAt: FieldRef<"Coin", 'DateTime'>
    readonly raydiumPoolAddress: FieldRef<"Coin", 'String'>
    readonly lpMintAddress: FieldRef<"Coin", 'String'>
    readonly lpTokensBurned: FieldRef<"Coin", 'Boolean'>
    readonly mintAuthorityRevoked: FieldRef<"Coin", 'Boolean'>
    readonly freezeAuthorityRevoked: FieldRef<"Coin", 'Boolean'>
    readonly createdAt: FieldRef<"Coin", 'DateTime'>
    readonly updatedAt: FieldRef<"Coin", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Coin findUnique
   */
  export type CoinFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Coin
     */
    select?: CoinSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Coin
     */
    omit?: CoinOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoinInclude<ExtArgs> | null
    /**
     * Filter, which Coin to fetch.
     */
    where: CoinWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Coin findUniqueOrThrow
   */
  export type CoinFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Coin
     */
    select?: CoinSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Coin
     */
    omit?: CoinOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoinInclude<ExtArgs> | null
    /**
     * Filter, which Coin to fetch.
     */
    where: CoinWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Coin findFirst
   */
  export type CoinFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Coin
     */
    select?: CoinSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Coin
     */
    omit?: CoinOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoinInclude<ExtArgs> | null
    /**
     * Filter, which Coin to fetch.
     */
    where?: CoinWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Coins to fetch.
     */
    orderBy?: CoinOrderByWithRelationInput | CoinOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Coins.
     */
    cursor?: CoinWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Coins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Coins.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Coins.
     */
    distinct?: CoinScalarFieldEnum | CoinScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Coin findFirstOrThrow
   */
  export type CoinFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Coin
     */
    select?: CoinSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Coin
     */
    omit?: CoinOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoinInclude<ExtArgs> | null
    /**
     * Filter, which Coin to fetch.
     */
    where?: CoinWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Coins to fetch.
     */
    orderBy?: CoinOrderByWithRelationInput | CoinOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Coins.
     */
    cursor?: CoinWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Coins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Coins.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Coins.
     */
    distinct?: CoinScalarFieldEnum | CoinScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Coin findMany
   */
  export type CoinFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Coin
     */
    select?: CoinSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Coin
     */
    omit?: CoinOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoinInclude<ExtArgs> | null
    /**
     * Filter, which Coins to fetch.
     */
    where?: CoinWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Coins to fetch.
     */
    orderBy?: CoinOrderByWithRelationInput | CoinOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Coins.
     */
    cursor?: CoinWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Coins from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Coins.
     */
    skip?: number
    distinct?: CoinScalarFieldEnum | CoinScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Coin create
   */
  export type CoinCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Coin
     */
    select?: CoinSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Coin
     */
    omit?: CoinOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoinInclude<ExtArgs> | null
    /**
     * The data needed to create a Coin.
     */
    data: XOR<CoinCreateInput, CoinUncheckedCreateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Coin createMany
   */
  export type CoinCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Coins.
     */
    data: CoinCreateManyInput | CoinCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Coin createManyAndReturn
   */
  export type CoinCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Coin
     */
    select?: CoinSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Coin
     */
    omit?: CoinOmit<ExtArgs> | null
    /**
     * The data used to create many Coins.
     */
    data: CoinCreateManyInput | CoinCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoinIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Coin update
   */
  export type CoinUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Coin
     */
    select?: CoinSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Coin
     */
    omit?: CoinOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoinInclude<ExtArgs> | null
    /**
     * The data needed to update a Coin.
     */
    data: XOR<CoinUpdateInput, CoinUncheckedUpdateInput>
    /**
     * Choose, which Coin to update.
     */
    where: CoinWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Coin updateMany
   */
  export type CoinUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Coins.
     */
    data: XOR<CoinUpdateManyMutationInput, CoinUncheckedUpdateManyInput>
    /**
     * Filter which Coins to update
     */
    where?: CoinWhereInput
    /**
     * Limit how many Coins to update.
     */
    limit?: number
  }

  /**
   * Coin updateManyAndReturn
   */
  export type CoinUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Coin
     */
    select?: CoinSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Coin
     */
    omit?: CoinOmit<ExtArgs> | null
    /**
     * The data used to update Coins.
     */
    data: XOR<CoinUpdateManyMutationInput, CoinUncheckedUpdateManyInput>
    /**
     * Filter which Coins to update
     */
    where?: CoinWhereInput
    /**
     * Limit how many Coins to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoinIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Coin upsert
   */
  export type CoinUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Coin
     */
    select?: CoinSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Coin
     */
    omit?: CoinOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoinInclude<ExtArgs> | null
    /**
     * The filter to search for the Coin to update in case it exists.
     */
    where: CoinWhereUniqueInput
    /**
     * In case the Coin found by the `where` argument doesn't exist, create a new Coin with this data.
     */
    create: XOR<CoinCreateInput, CoinUncheckedCreateInput>
    /**
     * In case the Coin was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CoinUpdateInput, CoinUncheckedUpdateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Coin delete
   */
  export type CoinDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Coin
     */
    select?: CoinSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Coin
     */
    omit?: CoinOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoinInclude<ExtArgs> | null
    /**
     * Filter which Coin to delete.
     */
    where: CoinWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Coin deleteMany
   */
  export type CoinDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Coins to delete
     */
    where?: CoinWhereInput
    /**
     * Limit how many Coins to delete.
     */
    limit?: number
  }

  /**
   * Coin.transactions
   */
  export type Coin$transactionsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    cursor?: TransactionWhereUniqueInput
    take?: number
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
  }

  /**
   * Coin.holdings
   */
  export type Coin$holdingsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Holding
     */
    select?: HoldingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Holding
     */
    omit?: HoldingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoldingInclude<ExtArgs> | null
    where?: HoldingWhereInput
    orderBy?: HoldingOrderByWithRelationInput | HoldingOrderByWithRelationInput[]
    cursor?: HoldingWhereUniqueInput
    take?: number
    skip?: number
    distinct?: HoldingScalarFieldEnum | HoldingScalarFieldEnum[]
  }

  /**
   * Coin.candles
   */
  export type Coin$candlesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candle
     */
    select?: CandleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candle
     */
    omit?: CandleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CandleInclude<ExtArgs> | null
    where?: CandleWhereInput
    orderBy?: CandleOrderByWithRelationInput | CandleOrderByWithRelationInput[]
    cursor?: CandleWhereUniqueInput
    take?: number
    skip?: number
    distinct?: CandleScalarFieldEnum | CandleScalarFieldEnum[]
  }

  /**
   * Coin without action
   */
  export type CoinDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Coin
     */
    select?: CoinSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Coin
     */
    omit?: CoinOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CoinInclude<ExtArgs> | null
  }


  /**
   * Model Holding
   */

  export type AggregateHolding = {
    _count: HoldingCountAggregateOutputType | null
    _avg: HoldingAvgAggregateOutputType | null
    _sum: HoldingSumAggregateOutputType | null
    _min: HoldingMinAggregateOutputType | null
    _max: HoldingMaxAggregateOutputType | null
  }

  export type HoldingAvgAggregateOutputType = {
    tokenBalance: Decimal | null
    costBasisSol: Decimal | null
    totalBought: Decimal | null
    totalSold: Decimal | null
  }

  export type HoldingSumAggregateOutputType = {
    tokenBalance: Decimal | null
    costBasisSol: Decimal | null
    totalBought: Decimal | null
    totalSold: Decimal | null
  }

  export type HoldingMinAggregateOutputType = {
    id: string | null
    walletAddress: string | null
    coinId: string | null
    tokenBalance: Decimal | null
    costBasisSol: Decimal | null
    totalBought: Decimal | null
    totalSold: Decimal | null
    updatedAt: Date | null
  }

  export type HoldingMaxAggregateOutputType = {
    id: string | null
    walletAddress: string | null
    coinId: string | null
    tokenBalance: Decimal | null
    costBasisSol: Decimal | null
    totalBought: Decimal | null
    totalSold: Decimal | null
    updatedAt: Date | null
  }

  export type HoldingCountAggregateOutputType = {
    id: number
    walletAddress: number
    coinId: number
    tokenBalance: number
    costBasisSol: number
    totalBought: number
    totalSold: number
    updatedAt: number
    _all: number
  }


  export type HoldingAvgAggregateInputType = {
    tokenBalance?: true
    costBasisSol?: true
    totalBought?: true
    totalSold?: true
  }

  export type HoldingSumAggregateInputType = {
    tokenBalance?: true
    costBasisSol?: true
    totalBought?: true
    totalSold?: true
  }

  export type HoldingMinAggregateInputType = {
    id?: true
    walletAddress?: true
    coinId?: true
    tokenBalance?: true
    costBasisSol?: true
    totalBought?: true
    totalSold?: true
    updatedAt?: true
  }

  export type HoldingMaxAggregateInputType = {
    id?: true
    walletAddress?: true
    coinId?: true
    tokenBalance?: true
    costBasisSol?: true
    totalBought?: true
    totalSold?: true
    updatedAt?: true
  }

  export type HoldingCountAggregateInputType = {
    id?: true
    walletAddress?: true
    coinId?: true
    tokenBalance?: true
    costBasisSol?: true
    totalBought?: true
    totalSold?: true
    updatedAt?: true
    _all?: true
  }

  export type HoldingAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Holding to aggregate.
     */
    where?: HoldingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Holdings to fetch.
     */
    orderBy?: HoldingOrderByWithRelationInput | HoldingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: HoldingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Holdings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Holdings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Holdings
    **/
    _count?: true | HoldingCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: HoldingAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: HoldingSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: HoldingMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: HoldingMaxAggregateInputType
  }

  export type GetHoldingAggregateType<T extends HoldingAggregateArgs> = {
        [P in keyof T & keyof AggregateHolding]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateHolding[P]>
      : GetScalarType<T[P], AggregateHolding[P]>
  }




  export type HoldingGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: HoldingWhereInput
    orderBy?: HoldingOrderByWithAggregationInput | HoldingOrderByWithAggregationInput[]
    by: HoldingScalarFieldEnum[] | HoldingScalarFieldEnum
    having?: HoldingScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: HoldingCountAggregateInputType | true
    _avg?: HoldingAvgAggregateInputType
    _sum?: HoldingSumAggregateInputType
    _min?: HoldingMinAggregateInputType
    _max?: HoldingMaxAggregateInputType
  }

  export type HoldingGroupByOutputType = {
    id: string
    walletAddress: string
    coinId: string
    tokenBalance: Decimal
    costBasisSol: Decimal
    totalBought: Decimal
    totalSold: Decimal
    updatedAt: Date
    _count: HoldingCountAggregateOutputType | null
    _avg: HoldingAvgAggregateOutputType | null
    _sum: HoldingSumAggregateOutputType | null
    _min: HoldingMinAggregateOutputType | null
    _max: HoldingMaxAggregateOutputType | null
  }

  type GetHoldingGroupByPayload<T extends HoldingGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<HoldingGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof HoldingGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], HoldingGroupByOutputType[P]>
            : GetScalarType<T[P], HoldingGroupByOutputType[P]>
        }
      >
    >


  export type HoldingSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    coinId?: boolean
    tokenBalance?: boolean
    costBasisSol?: boolean
    totalBought?: boolean
    totalSold?: boolean
    updatedAt?: boolean
    profile?: boolean | ProfileDefaultArgs<ExtArgs>
    coin?: boolean | CoinDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["holding"]>

  export type HoldingSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    coinId?: boolean
    tokenBalance?: boolean
    costBasisSol?: boolean
    totalBought?: boolean
    totalSold?: boolean
    updatedAt?: boolean
    profile?: boolean | ProfileDefaultArgs<ExtArgs>
    coin?: boolean | CoinDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["holding"]>

  export type HoldingSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    coinId?: boolean
    tokenBalance?: boolean
    costBasisSol?: boolean
    totalBought?: boolean
    totalSold?: boolean
    updatedAt?: boolean
    profile?: boolean | ProfileDefaultArgs<ExtArgs>
    coin?: boolean | CoinDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["holding"]>

  export type HoldingSelectScalar = {
    id?: boolean
    walletAddress?: boolean
    coinId?: boolean
    tokenBalance?: boolean
    costBasisSol?: boolean
    totalBought?: boolean
    totalSold?: boolean
    updatedAt?: boolean
  }

  export type HoldingOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "walletAddress" | "coinId" | "tokenBalance" | "costBasisSol" | "totalBought" | "totalSold" | "updatedAt", ExtArgs["result"]["holding"]>
  export type HoldingInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    profile?: boolean | ProfileDefaultArgs<ExtArgs>
    coin?: boolean | CoinDefaultArgs<ExtArgs>
  }
  export type HoldingIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    profile?: boolean | ProfileDefaultArgs<ExtArgs>
    coin?: boolean | CoinDefaultArgs<ExtArgs>
  }
  export type HoldingIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    profile?: boolean | ProfileDefaultArgs<ExtArgs>
    coin?: boolean | CoinDefaultArgs<ExtArgs>
  }

  export type $HoldingPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Holding"
    objects: {
      profile: Prisma.$ProfilePayload<ExtArgs>
      coin: Prisma.$CoinPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      walletAddress: string
      coinId: string
      tokenBalance: Prisma.Decimal
      costBasisSol: Prisma.Decimal
      totalBought: Prisma.Decimal
      totalSold: Prisma.Decimal
      updatedAt: Date
    }, ExtArgs["result"]["holding"]>
    composites: {}
  }

  type HoldingGetPayload<S extends boolean | null | undefined | HoldingDefaultArgs> = $Result.GetResult<Prisma.$HoldingPayload, S>

  type HoldingCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<HoldingFindManyArgs, 'select' | 'include' | 'distinct' | 'omit' | 'relationLoadStrategy'> & {
      select?: HoldingCountAggregateInputType | true
    }

  export interface HoldingDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Holding'], meta: { name: 'Holding' } }
    /**
     * Find zero or one Holding that matches the filter.
     * @param {HoldingFindUniqueArgs} args - Arguments to find a Holding
     * @example
     * // Get one Holding
     * const holding = await prisma.holding.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends HoldingFindUniqueArgs>(args: SelectSubset<T, HoldingFindUniqueArgs<ExtArgs>>): Prisma__HoldingClient<$Result.GetResult<Prisma.$HoldingPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Holding that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {HoldingFindUniqueOrThrowArgs} args - Arguments to find a Holding
     * @example
     * // Get one Holding
     * const holding = await prisma.holding.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends HoldingFindUniqueOrThrowArgs>(args: SelectSubset<T, HoldingFindUniqueOrThrowArgs<ExtArgs>>): Prisma__HoldingClient<$Result.GetResult<Prisma.$HoldingPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Holding that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HoldingFindFirstArgs} args - Arguments to find a Holding
     * @example
     * // Get one Holding
     * const holding = await prisma.holding.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends HoldingFindFirstArgs>(args?: SelectSubset<T, HoldingFindFirstArgs<ExtArgs>>): Prisma__HoldingClient<$Result.GetResult<Prisma.$HoldingPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Holding that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HoldingFindFirstOrThrowArgs} args - Arguments to find a Holding
     * @example
     * // Get one Holding
     * const holding = await prisma.holding.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends HoldingFindFirstOrThrowArgs>(args?: SelectSubset<T, HoldingFindFirstOrThrowArgs<ExtArgs>>): Prisma__HoldingClient<$Result.GetResult<Prisma.$HoldingPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Holdings that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HoldingFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Holdings
     * const holdings = await prisma.holding.findMany()
     * 
     * // Get first 10 Holdings
     * const holdings = await prisma.holding.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const holdingWithIdOnly = await prisma.holding.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends HoldingFindManyArgs>(args?: SelectSubset<T, HoldingFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HoldingPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Holding.
     * @param {HoldingCreateArgs} args - Arguments to create a Holding.
     * @example
     * // Create one Holding
     * const Holding = await prisma.holding.create({
     *   data: {
     *     // ... data to create a Holding
     *   }
     * })
     * 
     */
    create<T extends HoldingCreateArgs>(args: SelectSubset<T, HoldingCreateArgs<ExtArgs>>): Prisma__HoldingClient<$Result.GetResult<Prisma.$HoldingPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Holdings.
     * @param {HoldingCreateManyArgs} args - Arguments to create many Holdings.
     * @example
     * // Create many Holdings
     * const holding = await prisma.holding.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends HoldingCreateManyArgs>(args?: SelectSubset<T, HoldingCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Holdings and returns the data saved in the database.
     * @param {HoldingCreateManyAndReturnArgs} args - Arguments to create many Holdings.
     * @example
     * // Create many Holdings
     * const holding = await prisma.holding.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Holdings and only return the `id`
     * const holdingWithIdOnly = await prisma.holding.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends HoldingCreateManyAndReturnArgs>(args?: SelectSubset<T, HoldingCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HoldingPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Holding.
     * @param {HoldingDeleteArgs} args - Arguments to delete one Holding.
     * @example
     * // Delete one Holding
     * const Holding = await prisma.holding.delete({
     *   where: {
     *     // ... filter to delete one Holding
     *   }
     * })
     * 
     */
    delete<T extends HoldingDeleteArgs>(args: SelectSubset<T, HoldingDeleteArgs<ExtArgs>>): Prisma__HoldingClient<$Result.GetResult<Prisma.$HoldingPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Holding.
     * @param {HoldingUpdateArgs} args - Arguments to update one Holding.
     * @example
     * // Update one Holding
     * const holding = await prisma.holding.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends HoldingUpdateArgs>(args: SelectSubset<T, HoldingUpdateArgs<ExtArgs>>): Prisma__HoldingClient<$Result.GetResult<Prisma.$HoldingPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Holdings.
     * @param {HoldingDeleteManyArgs} args - Arguments to filter Holdings to delete.
     * @example
     * // Delete a few Holdings
     * const { count } = await prisma.holding.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends HoldingDeleteManyArgs>(args?: SelectSubset<T, HoldingDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Holdings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HoldingUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Holdings
     * const holding = await prisma.holding.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends HoldingUpdateManyArgs>(args: SelectSubset<T, HoldingUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Holdings and returns the data updated in the database.
     * @param {HoldingUpdateManyAndReturnArgs} args - Arguments to update many Holdings.
     * @example
     * // Update many Holdings
     * const holding = await prisma.holding.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Holdings and only return the `id`
     * const holdingWithIdOnly = await prisma.holding.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends HoldingUpdateManyAndReturnArgs>(args: SelectSubset<T, HoldingUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$HoldingPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Holding.
     * @param {HoldingUpsertArgs} args - Arguments to update or create a Holding.
     * @example
     * // Update or create a Holding
     * const holding = await prisma.holding.upsert({
     *   create: {
     *     // ... data to create a Holding
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Holding we want to update
     *   }
     * })
     */
    upsert<T extends HoldingUpsertArgs>(args: SelectSubset<T, HoldingUpsertArgs<ExtArgs>>): Prisma__HoldingClient<$Result.GetResult<Prisma.$HoldingPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Holdings.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HoldingCountArgs} args - Arguments to filter Holdings to count.
     * @example
     * // Count the number of Holdings
     * const count = await prisma.holding.count({
     *   where: {
     *     // ... the filter for the Holdings we want to count
     *   }
     * })
    **/
    count<T extends HoldingCountArgs>(
      args?: Subset<T, HoldingCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], HoldingCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Holding.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HoldingAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends HoldingAggregateArgs>(args: Subset<T, HoldingAggregateArgs>): Prisma.PrismaPromise<GetHoldingAggregateType<T>>

    /**
     * Group by Holding.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {HoldingGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends HoldingGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: HoldingGroupByArgs['orderBy'] }
        : { orderBy?: HoldingGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, HoldingGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetHoldingGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Holding model
   */
  readonly fields: HoldingFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Holding.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__HoldingClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    profile<T extends ProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProfileDefaultArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    coin<T extends CoinDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CoinDefaultArgs<ExtArgs>>): Prisma__CoinClient<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Holding model
   */
  interface HoldingFieldRefs {
    readonly id: FieldRef<"Holding", 'String'>
    readonly walletAddress: FieldRef<"Holding", 'String'>
    readonly coinId: FieldRef<"Holding", 'String'>
    readonly tokenBalance: FieldRef<"Holding", 'Decimal'>
    readonly costBasisSol: FieldRef<"Holding", 'Decimal'>
    readonly totalBought: FieldRef<"Holding", 'Decimal'>
    readonly totalSold: FieldRef<"Holding", 'Decimal'>
    readonly updatedAt: FieldRef<"Holding", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Holding findUnique
   */
  export type HoldingFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Holding
     */
    select?: HoldingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Holding
     */
    omit?: HoldingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoldingInclude<ExtArgs> | null
    /**
     * Filter, which Holding to fetch.
     */
    where: HoldingWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Holding findUniqueOrThrow
   */
  export type HoldingFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Holding
     */
    select?: HoldingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Holding
     */
    omit?: HoldingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoldingInclude<ExtArgs> | null
    /**
     * Filter, which Holding to fetch.
     */
    where: HoldingWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Holding findFirst
   */
  export type HoldingFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Holding
     */
    select?: HoldingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Holding
     */
    omit?: HoldingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoldingInclude<ExtArgs> | null
    /**
     * Filter, which Holding to fetch.
     */
    where?: HoldingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Holdings to fetch.
     */
    orderBy?: HoldingOrderByWithRelationInput | HoldingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Holdings.
     */
    cursor?: HoldingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Holdings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Holdings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Holdings.
     */
    distinct?: HoldingScalarFieldEnum | HoldingScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Holding findFirstOrThrow
   */
  export type HoldingFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Holding
     */
    select?: HoldingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Holding
     */
    omit?: HoldingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoldingInclude<ExtArgs> | null
    /**
     * Filter, which Holding to fetch.
     */
    where?: HoldingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Holdings to fetch.
     */
    orderBy?: HoldingOrderByWithRelationInput | HoldingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Holdings.
     */
    cursor?: HoldingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Holdings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Holdings.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Holdings.
     */
    distinct?: HoldingScalarFieldEnum | HoldingScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Holding findMany
   */
  export type HoldingFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Holding
     */
    select?: HoldingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Holding
     */
    omit?: HoldingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoldingInclude<ExtArgs> | null
    /**
     * Filter, which Holdings to fetch.
     */
    where?: HoldingWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Holdings to fetch.
     */
    orderBy?: HoldingOrderByWithRelationInput | HoldingOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Holdings.
     */
    cursor?: HoldingWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Holdings from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Holdings.
     */
    skip?: number
    distinct?: HoldingScalarFieldEnum | HoldingScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Holding create
   */
  export type HoldingCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Holding
     */
    select?: HoldingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Holding
     */
    omit?: HoldingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoldingInclude<ExtArgs> | null
    /**
     * The data needed to create a Holding.
     */
    data: XOR<HoldingCreateInput, HoldingUncheckedCreateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Holding createMany
   */
  export type HoldingCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Holdings.
     */
    data: HoldingCreateManyInput | HoldingCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Holding createManyAndReturn
   */
  export type HoldingCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Holding
     */
    select?: HoldingSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Holding
     */
    omit?: HoldingOmit<ExtArgs> | null
    /**
     * The data used to create many Holdings.
     */
    data: HoldingCreateManyInput | HoldingCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoldingIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Holding update
   */
  export type HoldingUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Holding
     */
    select?: HoldingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Holding
     */
    omit?: HoldingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoldingInclude<ExtArgs> | null
    /**
     * The data needed to update a Holding.
     */
    data: XOR<HoldingUpdateInput, HoldingUncheckedUpdateInput>
    /**
     * Choose, which Holding to update.
     */
    where: HoldingWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Holding updateMany
   */
  export type HoldingUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Holdings.
     */
    data: XOR<HoldingUpdateManyMutationInput, HoldingUncheckedUpdateManyInput>
    /**
     * Filter which Holdings to update
     */
    where?: HoldingWhereInput
    /**
     * Limit how many Holdings to update.
     */
    limit?: number
  }

  /**
   * Holding updateManyAndReturn
   */
  export type HoldingUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Holding
     */
    select?: HoldingSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Holding
     */
    omit?: HoldingOmit<ExtArgs> | null
    /**
     * The data used to update Holdings.
     */
    data: XOR<HoldingUpdateManyMutationInput, HoldingUncheckedUpdateManyInput>
    /**
     * Filter which Holdings to update
     */
    where?: HoldingWhereInput
    /**
     * Limit how many Holdings to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoldingIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Holding upsert
   */
  export type HoldingUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Holding
     */
    select?: HoldingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Holding
     */
    omit?: HoldingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoldingInclude<ExtArgs> | null
    /**
     * The filter to search for the Holding to update in case it exists.
     */
    where: HoldingWhereUniqueInput
    /**
     * In case the Holding found by the `where` argument doesn't exist, create a new Holding with this data.
     */
    create: XOR<HoldingCreateInput, HoldingUncheckedCreateInput>
    /**
     * In case the Holding was found with the provided `where` argument, update it with this data.
     */
    update: XOR<HoldingUpdateInput, HoldingUncheckedUpdateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Holding delete
   */
  export type HoldingDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Holding
     */
    select?: HoldingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Holding
     */
    omit?: HoldingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoldingInclude<ExtArgs> | null
    /**
     * Filter which Holding to delete.
     */
    where: HoldingWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Holding deleteMany
   */
  export type HoldingDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Holdings to delete
     */
    where?: HoldingWhereInput
    /**
     * Limit how many Holdings to delete.
     */
    limit?: number
  }

  /**
   * Holding without action
   */
  export type HoldingDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Holding
     */
    select?: HoldingSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Holding
     */
    omit?: HoldingOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: HoldingInclude<ExtArgs> | null
  }


  /**
   * Model Transaction
   */

  export type AggregateTransaction = {
    _count: TransactionCountAggregateOutputType | null
    _avg: TransactionAvgAggregateOutputType | null
    _sum: TransactionSumAggregateOutputType | null
    _min: TransactionMinAggregateOutputType | null
    _max: TransactionMaxAggregateOutputType | null
  }

  export type TransactionAvgAggregateOutputType = {
    slot: number | null
    solAmount: Decimal | null
    tokenAmount: Decimal | null
    pricePerToken: Decimal | null
    totalFee: Decimal | null
    creatorFee: Decimal | null
    referrerFee: Decimal | null
    treasuryFee: Decimal | null
    virtualSolAfter: Decimal | null
    virtualTokensAfter: Decimal | null
  }

  export type TransactionSumAggregateOutputType = {
    slot: bigint | null
    solAmount: Decimal | null
    tokenAmount: Decimal | null
    pricePerToken: Decimal | null
    totalFee: Decimal | null
    creatorFee: Decimal | null
    referrerFee: Decimal | null
    treasuryFee: Decimal | null
    virtualSolAfter: Decimal | null
    virtualTokensAfter: Decimal | null
  }

  export type TransactionMinAggregateOutputType = {
    id: string | null
    coinId: string | null
    walletAddress: string | null
    tradeType: $Enums.TradeType | null
    txSignature: string | null
    slot: bigint | null
    solAmount: Decimal | null
    tokenAmount: Decimal | null
    pricePerToken: Decimal | null
    totalFee: Decimal | null
    creatorFee: Decimal | null
    referrerFee: Decimal | null
    treasuryFee: Decimal | null
    virtualSolAfter: Decimal | null
    virtualTokensAfter: Decimal | null
    confirmedAt: Date | null
    createdAt: Date | null
  }

  export type TransactionMaxAggregateOutputType = {
    id: string | null
    coinId: string | null
    walletAddress: string | null
    tradeType: $Enums.TradeType | null
    txSignature: string | null
    slot: bigint | null
    solAmount: Decimal | null
    tokenAmount: Decimal | null
    pricePerToken: Decimal | null
    totalFee: Decimal | null
    creatorFee: Decimal | null
    referrerFee: Decimal | null
    treasuryFee: Decimal | null
    virtualSolAfter: Decimal | null
    virtualTokensAfter: Decimal | null
    confirmedAt: Date | null
    createdAt: Date | null
  }

  export type TransactionCountAggregateOutputType = {
    id: number
    coinId: number
    walletAddress: number
    tradeType: number
    txSignature: number
    slot: number
    solAmount: number
    tokenAmount: number
    pricePerToken: number
    totalFee: number
    creatorFee: number
    referrerFee: number
    treasuryFee: number
    virtualSolAfter: number
    virtualTokensAfter: number
    confirmedAt: number
    createdAt: number
    _all: number
  }


  export type TransactionAvgAggregateInputType = {
    slot?: true
    solAmount?: true
    tokenAmount?: true
    pricePerToken?: true
    totalFee?: true
    creatorFee?: true
    referrerFee?: true
    treasuryFee?: true
    virtualSolAfter?: true
    virtualTokensAfter?: true
  }

  export type TransactionSumAggregateInputType = {
    slot?: true
    solAmount?: true
    tokenAmount?: true
    pricePerToken?: true
    totalFee?: true
    creatorFee?: true
    referrerFee?: true
    treasuryFee?: true
    virtualSolAfter?: true
    virtualTokensAfter?: true
  }

  export type TransactionMinAggregateInputType = {
    id?: true
    coinId?: true
    walletAddress?: true
    tradeType?: true
    txSignature?: true
    slot?: true
    solAmount?: true
    tokenAmount?: true
    pricePerToken?: true
    totalFee?: true
    creatorFee?: true
    referrerFee?: true
    treasuryFee?: true
    virtualSolAfter?: true
    virtualTokensAfter?: true
    confirmedAt?: true
    createdAt?: true
  }

  export type TransactionMaxAggregateInputType = {
    id?: true
    coinId?: true
    walletAddress?: true
    tradeType?: true
    txSignature?: true
    slot?: true
    solAmount?: true
    tokenAmount?: true
    pricePerToken?: true
    totalFee?: true
    creatorFee?: true
    referrerFee?: true
    treasuryFee?: true
    virtualSolAfter?: true
    virtualTokensAfter?: true
    confirmedAt?: true
    createdAt?: true
  }

  export type TransactionCountAggregateInputType = {
    id?: true
    coinId?: true
    walletAddress?: true
    tradeType?: true
    txSignature?: true
    slot?: true
    solAmount?: true
    tokenAmount?: true
    pricePerToken?: true
    totalFee?: true
    creatorFee?: true
    referrerFee?: true
    treasuryFee?: true
    virtualSolAfter?: true
    virtualTokensAfter?: true
    confirmedAt?: true
    createdAt?: true
    _all?: true
  }

  export type TransactionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Transaction to aggregate.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Transactions
    **/
    _count?: true | TransactionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TransactionAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TransactionSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TransactionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TransactionMaxAggregateInputType
  }

  export type GetTransactionAggregateType<T extends TransactionAggregateArgs> = {
        [P in keyof T & keyof AggregateTransaction]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTransaction[P]>
      : GetScalarType<T[P], AggregateTransaction[P]>
  }




  export type TransactionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TransactionWhereInput
    orderBy?: TransactionOrderByWithAggregationInput | TransactionOrderByWithAggregationInput[]
    by: TransactionScalarFieldEnum[] | TransactionScalarFieldEnum
    having?: TransactionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TransactionCountAggregateInputType | true
    _avg?: TransactionAvgAggregateInputType
    _sum?: TransactionSumAggregateInputType
    _min?: TransactionMinAggregateInputType
    _max?: TransactionMaxAggregateInputType
  }

  export type TransactionGroupByOutputType = {
    id: string
    coinId: string
    walletAddress: string
    tradeType: $Enums.TradeType
    txSignature: string
    slot: bigint
    solAmount: Decimal
    tokenAmount: Decimal
    pricePerToken: Decimal
    totalFee: Decimal
    creatorFee: Decimal
    referrerFee: Decimal
    treasuryFee: Decimal
    virtualSolAfter: Decimal
    virtualTokensAfter: Decimal
    confirmedAt: Date
    createdAt: Date
    _count: TransactionCountAggregateOutputType | null
    _avg: TransactionAvgAggregateOutputType | null
    _sum: TransactionSumAggregateOutputType | null
    _min: TransactionMinAggregateOutputType | null
    _max: TransactionMaxAggregateOutputType | null
  }

  type GetTransactionGroupByPayload<T extends TransactionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TransactionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TransactionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TransactionGroupByOutputType[P]>
            : GetScalarType<T[P], TransactionGroupByOutputType[P]>
        }
      >
    >


  export type TransactionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    coinId?: boolean
    walletAddress?: boolean
    tradeType?: boolean
    txSignature?: boolean
    slot?: boolean
    solAmount?: boolean
    tokenAmount?: boolean
    pricePerToken?: boolean
    totalFee?: boolean
    creatorFee?: boolean
    referrerFee?: boolean
    treasuryFee?: boolean
    virtualSolAfter?: boolean
    virtualTokensAfter?: boolean
    confirmedAt?: boolean
    createdAt?: boolean
    coin?: boolean | CoinDefaultArgs<ExtArgs>
    profile?: boolean | ProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    coinId?: boolean
    walletAddress?: boolean
    tradeType?: boolean
    txSignature?: boolean
    slot?: boolean
    solAmount?: boolean
    tokenAmount?: boolean
    pricePerToken?: boolean
    totalFee?: boolean
    creatorFee?: boolean
    referrerFee?: boolean
    treasuryFee?: boolean
    virtualSolAfter?: boolean
    virtualTokensAfter?: boolean
    confirmedAt?: boolean
    createdAt?: boolean
    coin?: boolean | CoinDefaultArgs<ExtArgs>
    profile?: boolean | ProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    coinId?: boolean
    walletAddress?: boolean
    tradeType?: boolean
    txSignature?: boolean
    slot?: boolean
    solAmount?: boolean
    tokenAmount?: boolean
    pricePerToken?: boolean
    totalFee?: boolean
    creatorFee?: boolean
    referrerFee?: boolean
    treasuryFee?: boolean
    virtualSolAfter?: boolean
    virtualTokensAfter?: boolean
    confirmedAt?: boolean
    createdAt?: boolean
    coin?: boolean | CoinDefaultArgs<ExtArgs>
    profile?: boolean | ProfileDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["transaction"]>

  export type TransactionSelectScalar = {
    id?: boolean
    coinId?: boolean
    walletAddress?: boolean
    tradeType?: boolean
    txSignature?: boolean
    slot?: boolean
    solAmount?: boolean
    tokenAmount?: boolean
    pricePerToken?: boolean
    totalFee?: boolean
    creatorFee?: boolean
    referrerFee?: boolean
    treasuryFee?: boolean
    virtualSolAfter?: boolean
    virtualTokensAfter?: boolean
    confirmedAt?: boolean
    createdAt?: boolean
  }

  export type TransactionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "coinId" | "walletAddress" | "tradeType" | "txSignature" | "slot" | "solAmount" | "tokenAmount" | "pricePerToken" | "totalFee" | "creatorFee" | "referrerFee" | "treasuryFee" | "virtualSolAfter" | "virtualTokensAfter" | "confirmedAt" | "createdAt", ExtArgs["result"]["transaction"]>
  export type TransactionInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    coin?: boolean | CoinDefaultArgs<ExtArgs>
    profile?: boolean | ProfileDefaultArgs<ExtArgs>
  }
  export type TransactionIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    coin?: boolean | CoinDefaultArgs<ExtArgs>
    profile?: boolean | ProfileDefaultArgs<ExtArgs>
  }
  export type TransactionIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    coin?: boolean | CoinDefaultArgs<ExtArgs>
    profile?: boolean | ProfileDefaultArgs<ExtArgs>
  }

  export type $TransactionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Transaction"
    objects: {
      coin: Prisma.$CoinPayload<ExtArgs>
      profile: Prisma.$ProfilePayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      coinId: string
      walletAddress: string
      tradeType: $Enums.TradeType
      txSignature: string
      slot: bigint
      solAmount: Prisma.Decimal
      tokenAmount: Prisma.Decimal
      pricePerToken: Prisma.Decimal
      totalFee: Prisma.Decimal
      creatorFee: Prisma.Decimal
      referrerFee: Prisma.Decimal
      treasuryFee: Prisma.Decimal
      virtualSolAfter: Prisma.Decimal
      virtualTokensAfter: Prisma.Decimal
      confirmedAt: Date
      createdAt: Date
    }, ExtArgs["result"]["transaction"]>
    composites: {}
  }

  type TransactionGetPayload<S extends boolean | null | undefined | TransactionDefaultArgs> = $Result.GetResult<Prisma.$TransactionPayload, S>

  type TransactionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TransactionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit' | 'relationLoadStrategy'> & {
      select?: TransactionCountAggregateInputType | true
    }

  export interface TransactionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Transaction'], meta: { name: 'Transaction' } }
    /**
     * Find zero or one Transaction that matches the filter.
     * @param {TransactionFindUniqueArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TransactionFindUniqueArgs>(args: SelectSubset<T, TransactionFindUniqueArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Transaction that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TransactionFindUniqueOrThrowArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TransactionFindUniqueOrThrowArgs>(args: SelectSubset<T, TransactionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Transaction that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindFirstArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TransactionFindFirstArgs>(args?: SelectSubset<T, TransactionFindFirstArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Transaction that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindFirstOrThrowArgs} args - Arguments to find a Transaction
     * @example
     * // Get one Transaction
     * const transaction = await prisma.transaction.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TransactionFindFirstOrThrowArgs>(args?: SelectSubset<T, TransactionFindFirstOrThrowArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Transactions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Transactions
     * const transactions = await prisma.transaction.findMany()
     * 
     * // Get first 10 Transactions
     * const transactions = await prisma.transaction.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const transactionWithIdOnly = await prisma.transaction.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TransactionFindManyArgs>(args?: SelectSubset<T, TransactionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Transaction.
     * @param {TransactionCreateArgs} args - Arguments to create a Transaction.
     * @example
     * // Create one Transaction
     * const Transaction = await prisma.transaction.create({
     *   data: {
     *     // ... data to create a Transaction
     *   }
     * })
     * 
     */
    create<T extends TransactionCreateArgs>(args: SelectSubset<T, TransactionCreateArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Transactions.
     * @param {TransactionCreateManyArgs} args - Arguments to create many Transactions.
     * @example
     * // Create many Transactions
     * const transaction = await prisma.transaction.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TransactionCreateManyArgs>(args?: SelectSubset<T, TransactionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Transactions and returns the data saved in the database.
     * @param {TransactionCreateManyAndReturnArgs} args - Arguments to create many Transactions.
     * @example
     * // Create many Transactions
     * const transaction = await prisma.transaction.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Transactions and only return the `id`
     * const transactionWithIdOnly = await prisma.transaction.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TransactionCreateManyAndReturnArgs>(args?: SelectSubset<T, TransactionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Transaction.
     * @param {TransactionDeleteArgs} args - Arguments to delete one Transaction.
     * @example
     * // Delete one Transaction
     * const Transaction = await prisma.transaction.delete({
     *   where: {
     *     // ... filter to delete one Transaction
     *   }
     * })
     * 
     */
    delete<T extends TransactionDeleteArgs>(args: SelectSubset<T, TransactionDeleteArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Transaction.
     * @param {TransactionUpdateArgs} args - Arguments to update one Transaction.
     * @example
     * // Update one Transaction
     * const transaction = await prisma.transaction.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TransactionUpdateArgs>(args: SelectSubset<T, TransactionUpdateArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Transactions.
     * @param {TransactionDeleteManyArgs} args - Arguments to filter Transactions to delete.
     * @example
     * // Delete a few Transactions
     * const { count } = await prisma.transaction.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TransactionDeleteManyArgs>(args?: SelectSubset<T, TransactionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Transactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Transactions
     * const transaction = await prisma.transaction.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TransactionUpdateManyArgs>(args: SelectSubset<T, TransactionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Transactions and returns the data updated in the database.
     * @param {TransactionUpdateManyAndReturnArgs} args - Arguments to update many Transactions.
     * @example
     * // Update many Transactions
     * const transaction = await prisma.transaction.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Transactions and only return the `id`
     * const transactionWithIdOnly = await prisma.transaction.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TransactionUpdateManyAndReturnArgs>(args: SelectSubset<T, TransactionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Transaction.
     * @param {TransactionUpsertArgs} args - Arguments to update or create a Transaction.
     * @example
     * // Update or create a Transaction
     * const transaction = await prisma.transaction.upsert({
     *   create: {
     *     // ... data to create a Transaction
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Transaction we want to update
     *   }
     * })
     */
    upsert<T extends TransactionUpsertArgs>(args: SelectSubset<T, TransactionUpsertArgs<ExtArgs>>): Prisma__TransactionClient<$Result.GetResult<Prisma.$TransactionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Transactions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionCountArgs} args - Arguments to filter Transactions to count.
     * @example
     * // Count the number of Transactions
     * const count = await prisma.transaction.count({
     *   where: {
     *     // ... the filter for the Transactions we want to count
     *   }
     * })
    **/
    count<T extends TransactionCountArgs>(
      args?: Subset<T, TransactionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TransactionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Transaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TransactionAggregateArgs>(args: Subset<T, TransactionAggregateArgs>): Prisma.PrismaPromise<GetTransactionAggregateType<T>>

    /**
     * Group by Transaction.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TransactionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TransactionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TransactionGroupByArgs['orderBy'] }
        : { orderBy?: TransactionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TransactionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTransactionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Transaction model
   */
  readonly fields: TransactionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Transaction.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TransactionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    coin<T extends CoinDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CoinDefaultArgs<ExtArgs>>): Prisma__CoinClient<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    profile<T extends ProfileDefaultArgs<ExtArgs> = {}>(args?: Subset<T, ProfileDefaultArgs<ExtArgs>>): Prisma__ProfileClient<$Result.GetResult<Prisma.$ProfilePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Transaction model
   */
  interface TransactionFieldRefs {
    readonly id: FieldRef<"Transaction", 'String'>
    readonly coinId: FieldRef<"Transaction", 'String'>
    readonly walletAddress: FieldRef<"Transaction", 'String'>
    readonly tradeType: FieldRef<"Transaction", 'TradeType'>
    readonly txSignature: FieldRef<"Transaction", 'String'>
    readonly slot: FieldRef<"Transaction", 'BigInt'>
    readonly solAmount: FieldRef<"Transaction", 'Decimal'>
    readonly tokenAmount: FieldRef<"Transaction", 'Decimal'>
    readonly pricePerToken: FieldRef<"Transaction", 'Decimal'>
    readonly totalFee: FieldRef<"Transaction", 'Decimal'>
    readonly creatorFee: FieldRef<"Transaction", 'Decimal'>
    readonly referrerFee: FieldRef<"Transaction", 'Decimal'>
    readonly treasuryFee: FieldRef<"Transaction", 'Decimal'>
    readonly virtualSolAfter: FieldRef<"Transaction", 'Decimal'>
    readonly virtualTokensAfter: FieldRef<"Transaction", 'Decimal'>
    readonly confirmedAt: FieldRef<"Transaction", 'DateTime'>
    readonly createdAt: FieldRef<"Transaction", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Transaction findUnique
   */
  export type TransactionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where: TransactionWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Transaction findUniqueOrThrow
   */
  export type TransactionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where: TransactionWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Transaction findFirst
   */
  export type TransactionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Transactions.
     */
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Transaction findFirstOrThrow
   */
  export type TransactionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transaction to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Transactions.
     */
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Transaction findMany
   */
  export type TransactionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter, which Transactions to fetch.
     */
    where?: TransactionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Transactions to fetch.
     */
    orderBy?: TransactionOrderByWithRelationInput | TransactionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Transactions.
     */
    cursor?: TransactionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Transactions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Transactions.
     */
    skip?: number
    distinct?: TransactionScalarFieldEnum | TransactionScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Transaction create
   */
  export type TransactionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The data needed to create a Transaction.
     */
    data: XOR<TransactionCreateInput, TransactionUncheckedCreateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Transaction createMany
   */
  export type TransactionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Transactions.
     */
    data: TransactionCreateManyInput | TransactionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Transaction createManyAndReturn
   */
  export type TransactionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * The data used to create many Transactions.
     */
    data: TransactionCreateManyInput | TransactionCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Transaction update
   */
  export type TransactionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The data needed to update a Transaction.
     */
    data: XOR<TransactionUpdateInput, TransactionUncheckedUpdateInput>
    /**
     * Choose, which Transaction to update.
     */
    where: TransactionWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Transaction updateMany
   */
  export type TransactionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Transactions.
     */
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyInput>
    /**
     * Filter which Transactions to update
     */
    where?: TransactionWhereInput
    /**
     * Limit how many Transactions to update.
     */
    limit?: number
  }

  /**
   * Transaction updateManyAndReturn
   */
  export type TransactionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * The data used to update Transactions.
     */
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyInput>
    /**
     * Filter which Transactions to update
     */
    where?: TransactionWhereInput
    /**
     * Limit how many Transactions to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Transaction upsert
   */
  export type TransactionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * The filter to search for the Transaction to update in case it exists.
     */
    where: TransactionWhereUniqueInput
    /**
     * In case the Transaction found by the `where` argument doesn't exist, create a new Transaction with this data.
     */
    create: XOR<TransactionCreateInput, TransactionUncheckedCreateInput>
    /**
     * In case the Transaction was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TransactionUpdateInput, TransactionUncheckedUpdateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Transaction delete
   */
  export type TransactionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
    /**
     * Filter which Transaction to delete.
     */
    where: TransactionWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Transaction deleteMany
   */
  export type TransactionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Transactions to delete
     */
    where?: TransactionWhereInput
    /**
     * Limit how many Transactions to delete.
     */
    limit?: number
  }

  /**
   * Transaction without action
   */
  export type TransactionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Transaction
     */
    select?: TransactionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Transaction
     */
    omit?: TransactionOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: TransactionInclude<ExtArgs> | null
  }


  /**
   * Model Candle
   */

  export type AggregateCandle = {
    _count: CandleCountAggregateOutputType | null
    _avg: CandleAvgAggregateOutputType | null
    _sum: CandleSumAggregateOutputType | null
    _min: CandleMinAggregateOutputType | null
    _max: CandleMaxAggregateOutputType | null
  }

  export type CandleAvgAggregateOutputType = {
    openTime: number | null
    open: Decimal | null
    high: Decimal | null
    low: Decimal | null
    close: Decimal | null
    volume: Decimal | null
    trades: number | null
  }

  export type CandleSumAggregateOutputType = {
    openTime: bigint | null
    open: Decimal | null
    high: Decimal | null
    low: Decimal | null
    close: Decimal | null
    volume: Decimal | null
    trades: number | null
  }

  export type CandleMinAggregateOutputType = {
    id: string | null
    coinId: string | null
    timeframe: $Enums.Timeframe | null
    openTime: bigint | null
    open: Decimal | null
    high: Decimal | null
    low: Decimal | null
    close: Decimal | null
    volume: Decimal | null
    trades: number | null
    updatedAt: Date | null
  }

  export type CandleMaxAggregateOutputType = {
    id: string | null
    coinId: string | null
    timeframe: $Enums.Timeframe | null
    openTime: bigint | null
    open: Decimal | null
    high: Decimal | null
    low: Decimal | null
    close: Decimal | null
    volume: Decimal | null
    trades: number | null
    updatedAt: Date | null
  }

  export type CandleCountAggregateOutputType = {
    id: number
    coinId: number
    timeframe: number
    openTime: number
    open: number
    high: number
    low: number
    close: number
    volume: number
    trades: number
    updatedAt: number
    _all: number
  }


  export type CandleAvgAggregateInputType = {
    openTime?: true
    open?: true
    high?: true
    low?: true
    close?: true
    volume?: true
    trades?: true
  }

  export type CandleSumAggregateInputType = {
    openTime?: true
    open?: true
    high?: true
    low?: true
    close?: true
    volume?: true
    trades?: true
  }

  export type CandleMinAggregateInputType = {
    id?: true
    coinId?: true
    timeframe?: true
    openTime?: true
    open?: true
    high?: true
    low?: true
    close?: true
    volume?: true
    trades?: true
    updatedAt?: true
  }

  export type CandleMaxAggregateInputType = {
    id?: true
    coinId?: true
    timeframe?: true
    openTime?: true
    open?: true
    high?: true
    low?: true
    close?: true
    volume?: true
    trades?: true
    updatedAt?: true
  }

  export type CandleCountAggregateInputType = {
    id?: true
    coinId?: true
    timeframe?: true
    openTime?: true
    open?: true
    high?: true
    low?: true
    close?: true
    volume?: true
    trades?: true
    updatedAt?: true
    _all?: true
  }

  export type CandleAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Candle to aggregate.
     */
    where?: CandleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Candles to fetch.
     */
    orderBy?: CandleOrderByWithRelationInput | CandleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CandleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Candles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Candles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Candles
    **/
    _count?: true | CandleCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CandleAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CandleSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CandleMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CandleMaxAggregateInputType
  }

  export type GetCandleAggregateType<T extends CandleAggregateArgs> = {
        [P in keyof T & keyof AggregateCandle]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCandle[P]>
      : GetScalarType<T[P], AggregateCandle[P]>
  }




  export type CandleGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CandleWhereInput
    orderBy?: CandleOrderByWithAggregationInput | CandleOrderByWithAggregationInput[]
    by: CandleScalarFieldEnum[] | CandleScalarFieldEnum
    having?: CandleScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CandleCountAggregateInputType | true
    _avg?: CandleAvgAggregateInputType
    _sum?: CandleSumAggregateInputType
    _min?: CandleMinAggregateInputType
    _max?: CandleMaxAggregateInputType
  }

  export type CandleGroupByOutputType = {
    id: string
    coinId: string
    timeframe: $Enums.Timeframe
    openTime: bigint
    open: Decimal
    high: Decimal
    low: Decimal
    close: Decimal
    volume: Decimal
    trades: number
    updatedAt: Date
    _count: CandleCountAggregateOutputType | null
    _avg: CandleAvgAggregateOutputType | null
    _sum: CandleSumAggregateOutputType | null
    _min: CandleMinAggregateOutputType | null
    _max: CandleMaxAggregateOutputType | null
  }

  type GetCandleGroupByPayload<T extends CandleGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CandleGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CandleGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CandleGroupByOutputType[P]>
            : GetScalarType<T[P], CandleGroupByOutputType[P]>
        }
      >
    >


  export type CandleSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    coinId?: boolean
    timeframe?: boolean
    openTime?: boolean
    open?: boolean
    high?: boolean
    low?: boolean
    close?: boolean
    volume?: boolean
    trades?: boolean
    updatedAt?: boolean
    coin?: boolean | CoinDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["candle"]>

  export type CandleSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    coinId?: boolean
    timeframe?: boolean
    openTime?: boolean
    open?: boolean
    high?: boolean
    low?: boolean
    close?: boolean
    volume?: boolean
    trades?: boolean
    updatedAt?: boolean
    coin?: boolean | CoinDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["candle"]>

  export type CandleSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    coinId?: boolean
    timeframe?: boolean
    openTime?: boolean
    open?: boolean
    high?: boolean
    low?: boolean
    close?: boolean
    volume?: boolean
    trades?: boolean
    updatedAt?: boolean
    coin?: boolean | CoinDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["candle"]>

  export type CandleSelectScalar = {
    id?: boolean
    coinId?: boolean
    timeframe?: boolean
    openTime?: boolean
    open?: boolean
    high?: boolean
    low?: boolean
    close?: boolean
    volume?: boolean
    trades?: boolean
    updatedAt?: boolean
  }

  export type CandleOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "coinId" | "timeframe" | "openTime" | "open" | "high" | "low" | "close" | "volume" | "trades" | "updatedAt", ExtArgs["result"]["candle"]>
  export type CandleInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    coin?: boolean | CoinDefaultArgs<ExtArgs>
  }
  export type CandleIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    coin?: boolean | CoinDefaultArgs<ExtArgs>
  }
  export type CandleIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    coin?: boolean | CoinDefaultArgs<ExtArgs>
  }

  export type $CandlePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Candle"
    objects: {
      coin: Prisma.$CoinPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      coinId: string
      timeframe: $Enums.Timeframe
      openTime: bigint
      open: Prisma.Decimal
      high: Prisma.Decimal
      low: Prisma.Decimal
      close: Prisma.Decimal
      volume: Prisma.Decimal
      trades: number
      updatedAt: Date
    }, ExtArgs["result"]["candle"]>
    composites: {}
  }

  type CandleGetPayload<S extends boolean | null | undefined | CandleDefaultArgs> = $Result.GetResult<Prisma.$CandlePayload, S>

  type CandleCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CandleFindManyArgs, 'select' | 'include' | 'distinct' | 'omit' | 'relationLoadStrategy'> & {
      select?: CandleCountAggregateInputType | true
    }

  export interface CandleDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Candle'], meta: { name: 'Candle' } }
    /**
     * Find zero or one Candle that matches the filter.
     * @param {CandleFindUniqueArgs} args - Arguments to find a Candle
     * @example
     * // Get one Candle
     * const candle = await prisma.candle.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CandleFindUniqueArgs>(args: SelectSubset<T, CandleFindUniqueArgs<ExtArgs>>): Prisma__CandleClient<$Result.GetResult<Prisma.$CandlePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Candle that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CandleFindUniqueOrThrowArgs} args - Arguments to find a Candle
     * @example
     * // Get one Candle
     * const candle = await prisma.candle.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CandleFindUniqueOrThrowArgs>(args: SelectSubset<T, CandleFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CandleClient<$Result.GetResult<Prisma.$CandlePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Candle that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CandleFindFirstArgs} args - Arguments to find a Candle
     * @example
     * // Get one Candle
     * const candle = await prisma.candle.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CandleFindFirstArgs>(args?: SelectSubset<T, CandleFindFirstArgs<ExtArgs>>): Prisma__CandleClient<$Result.GetResult<Prisma.$CandlePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Candle that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CandleFindFirstOrThrowArgs} args - Arguments to find a Candle
     * @example
     * // Get one Candle
     * const candle = await prisma.candle.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CandleFindFirstOrThrowArgs>(args?: SelectSubset<T, CandleFindFirstOrThrowArgs<ExtArgs>>): Prisma__CandleClient<$Result.GetResult<Prisma.$CandlePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Candles that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CandleFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Candles
     * const candles = await prisma.candle.findMany()
     * 
     * // Get first 10 Candles
     * const candles = await prisma.candle.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const candleWithIdOnly = await prisma.candle.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CandleFindManyArgs>(args?: SelectSubset<T, CandleFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CandlePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Candle.
     * @param {CandleCreateArgs} args - Arguments to create a Candle.
     * @example
     * // Create one Candle
     * const Candle = await prisma.candle.create({
     *   data: {
     *     // ... data to create a Candle
     *   }
     * })
     * 
     */
    create<T extends CandleCreateArgs>(args: SelectSubset<T, CandleCreateArgs<ExtArgs>>): Prisma__CandleClient<$Result.GetResult<Prisma.$CandlePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Candles.
     * @param {CandleCreateManyArgs} args - Arguments to create many Candles.
     * @example
     * // Create many Candles
     * const candle = await prisma.candle.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CandleCreateManyArgs>(args?: SelectSubset<T, CandleCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Candles and returns the data saved in the database.
     * @param {CandleCreateManyAndReturnArgs} args - Arguments to create many Candles.
     * @example
     * // Create many Candles
     * const candle = await prisma.candle.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Candles and only return the `id`
     * const candleWithIdOnly = await prisma.candle.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CandleCreateManyAndReturnArgs>(args?: SelectSubset<T, CandleCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CandlePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Candle.
     * @param {CandleDeleteArgs} args - Arguments to delete one Candle.
     * @example
     * // Delete one Candle
     * const Candle = await prisma.candle.delete({
     *   where: {
     *     // ... filter to delete one Candle
     *   }
     * })
     * 
     */
    delete<T extends CandleDeleteArgs>(args: SelectSubset<T, CandleDeleteArgs<ExtArgs>>): Prisma__CandleClient<$Result.GetResult<Prisma.$CandlePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Candle.
     * @param {CandleUpdateArgs} args - Arguments to update one Candle.
     * @example
     * // Update one Candle
     * const candle = await prisma.candle.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CandleUpdateArgs>(args: SelectSubset<T, CandleUpdateArgs<ExtArgs>>): Prisma__CandleClient<$Result.GetResult<Prisma.$CandlePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Candles.
     * @param {CandleDeleteManyArgs} args - Arguments to filter Candles to delete.
     * @example
     * // Delete a few Candles
     * const { count } = await prisma.candle.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CandleDeleteManyArgs>(args?: SelectSubset<T, CandleDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Candles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CandleUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Candles
     * const candle = await prisma.candle.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CandleUpdateManyArgs>(args: SelectSubset<T, CandleUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Candles and returns the data updated in the database.
     * @param {CandleUpdateManyAndReturnArgs} args - Arguments to update many Candles.
     * @example
     * // Update many Candles
     * const candle = await prisma.candle.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Candles and only return the `id`
     * const candleWithIdOnly = await prisma.candle.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CandleUpdateManyAndReturnArgs>(args: SelectSubset<T, CandleUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CandlePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Candle.
     * @param {CandleUpsertArgs} args - Arguments to update or create a Candle.
     * @example
     * // Update or create a Candle
     * const candle = await prisma.candle.upsert({
     *   create: {
     *     // ... data to create a Candle
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Candle we want to update
     *   }
     * })
     */
    upsert<T extends CandleUpsertArgs>(args: SelectSubset<T, CandleUpsertArgs<ExtArgs>>): Prisma__CandleClient<$Result.GetResult<Prisma.$CandlePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Candles.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CandleCountArgs} args - Arguments to filter Candles to count.
     * @example
     * // Count the number of Candles
     * const count = await prisma.candle.count({
     *   where: {
     *     // ... the filter for the Candles we want to count
     *   }
     * })
    **/
    count<T extends CandleCountArgs>(
      args?: Subset<T, CandleCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CandleCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Candle.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CandleAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CandleAggregateArgs>(args: Subset<T, CandleAggregateArgs>): Prisma.PrismaPromise<GetCandleAggregateType<T>>

    /**
     * Group by Candle.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CandleGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CandleGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CandleGroupByArgs['orderBy'] }
        : { orderBy?: CandleGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CandleGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCandleGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Candle model
   */
  readonly fields: CandleFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Candle.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CandleClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    coin<T extends CoinDefaultArgs<ExtArgs> = {}>(args?: Subset<T, CoinDefaultArgs<ExtArgs>>): Prisma__CoinClient<$Result.GetResult<Prisma.$CoinPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Candle model
   */
  interface CandleFieldRefs {
    readonly id: FieldRef<"Candle", 'String'>
    readonly coinId: FieldRef<"Candle", 'String'>
    readonly timeframe: FieldRef<"Candle", 'Timeframe'>
    readonly openTime: FieldRef<"Candle", 'BigInt'>
    readonly open: FieldRef<"Candle", 'Decimal'>
    readonly high: FieldRef<"Candle", 'Decimal'>
    readonly low: FieldRef<"Candle", 'Decimal'>
    readonly close: FieldRef<"Candle", 'Decimal'>
    readonly volume: FieldRef<"Candle", 'Decimal'>
    readonly trades: FieldRef<"Candle", 'Int'>
    readonly updatedAt: FieldRef<"Candle", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Candle findUnique
   */
  export type CandleFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candle
     */
    select?: CandleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candle
     */
    omit?: CandleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CandleInclude<ExtArgs> | null
    /**
     * Filter, which Candle to fetch.
     */
    where: CandleWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Candle findUniqueOrThrow
   */
  export type CandleFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candle
     */
    select?: CandleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candle
     */
    omit?: CandleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CandleInclude<ExtArgs> | null
    /**
     * Filter, which Candle to fetch.
     */
    where: CandleWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Candle findFirst
   */
  export type CandleFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candle
     */
    select?: CandleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candle
     */
    omit?: CandleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CandleInclude<ExtArgs> | null
    /**
     * Filter, which Candle to fetch.
     */
    where?: CandleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Candles to fetch.
     */
    orderBy?: CandleOrderByWithRelationInput | CandleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Candles.
     */
    cursor?: CandleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Candles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Candles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Candles.
     */
    distinct?: CandleScalarFieldEnum | CandleScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Candle findFirstOrThrow
   */
  export type CandleFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candle
     */
    select?: CandleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candle
     */
    omit?: CandleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CandleInclude<ExtArgs> | null
    /**
     * Filter, which Candle to fetch.
     */
    where?: CandleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Candles to fetch.
     */
    orderBy?: CandleOrderByWithRelationInput | CandleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Candles.
     */
    cursor?: CandleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Candles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Candles.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Candles.
     */
    distinct?: CandleScalarFieldEnum | CandleScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Candle findMany
   */
  export type CandleFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candle
     */
    select?: CandleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candle
     */
    omit?: CandleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CandleInclude<ExtArgs> | null
    /**
     * Filter, which Candles to fetch.
     */
    where?: CandleWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Candles to fetch.
     */
    orderBy?: CandleOrderByWithRelationInput | CandleOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Candles.
     */
    cursor?: CandleWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Candles from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Candles.
     */
    skip?: number
    distinct?: CandleScalarFieldEnum | CandleScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Candle create
   */
  export type CandleCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candle
     */
    select?: CandleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candle
     */
    omit?: CandleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CandleInclude<ExtArgs> | null
    /**
     * The data needed to create a Candle.
     */
    data: XOR<CandleCreateInput, CandleUncheckedCreateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Candle createMany
   */
  export type CandleCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Candles.
     */
    data: CandleCreateManyInput | CandleCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Candle createManyAndReturn
   */
  export type CandleCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candle
     */
    select?: CandleSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Candle
     */
    omit?: CandleOmit<ExtArgs> | null
    /**
     * The data used to create many Candles.
     */
    data: CandleCreateManyInput | CandleCreateManyInput[]
    skipDuplicates?: boolean
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CandleIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Candle update
   */
  export type CandleUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candle
     */
    select?: CandleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candle
     */
    omit?: CandleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CandleInclude<ExtArgs> | null
    /**
     * The data needed to update a Candle.
     */
    data: XOR<CandleUpdateInput, CandleUncheckedUpdateInput>
    /**
     * Choose, which Candle to update.
     */
    where: CandleWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Candle updateMany
   */
  export type CandleUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Candles.
     */
    data: XOR<CandleUpdateManyMutationInput, CandleUncheckedUpdateManyInput>
    /**
     * Filter which Candles to update
     */
    where?: CandleWhereInput
    /**
     * Limit how many Candles to update.
     */
    limit?: number
  }

  /**
   * Candle updateManyAndReturn
   */
  export type CandleUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candle
     */
    select?: CandleSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Candle
     */
    omit?: CandleOmit<ExtArgs> | null
    /**
     * The data used to update Candles.
     */
    data: XOR<CandleUpdateManyMutationInput, CandleUncheckedUpdateManyInput>
    /**
     * Filter which Candles to update
     */
    where?: CandleWhereInput
    /**
     * Limit how many Candles to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CandleIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Candle upsert
   */
  export type CandleUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candle
     */
    select?: CandleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candle
     */
    omit?: CandleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CandleInclude<ExtArgs> | null
    /**
     * The filter to search for the Candle to update in case it exists.
     */
    where: CandleWhereUniqueInput
    /**
     * In case the Candle found by the `where` argument doesn't exist, create a new Candle with this data.
     */
    create: XOR<CandleCreateInput, CandleUncheckedCreateInput>
    /**
     * In case the Candle was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CandleUpdateInput, CandleUncheckedUpdateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Candle delete
   */
  export type CandleDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candle
     */
    select?: CandleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candle
     */
    omit?: CandleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CandleInclude<ExtArgs> | null
    /**
     * Filter which Candle to delete.
     */
    where: CandleWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Candle deleteMany
   */
  export type CandleDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Candles to delete
     */
    where?: CandleWhereInput
    /**
     * Limit how many Candles to delete.
     */
    limit?: number
  }

  /**
   * Candle without action
   */
  export type CandleDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Candle
     */
    select?: CandleSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Candle
     */
    omit?: CandleOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CandleInclude<ExtArgs> | null
  }


  /**
   * Model ReferralAccount
   */

  export type AggregateReferralAccount = {
    _count: ReferralAccountCountAggregateOutputType | null
    _avg: ReferralAccountAvgAggregateOutputType | null
    _sum: ReferralAccountSumAggregateOutputType | null
    _min: ReferralAccountMinAggregateOutputType | null
    _max: ReferralAccountMaxAggregateOutputType | null
  }

  export type ReferralAccountAvgAggregateOutputType = {
    totalFeesEarned: Decimal | null
    totalFeesClaimed: Decimal | null
    pendingFees: Decimal | null
    referralCount: number | null
  }

  export type ReferralAccountSumAggregateOutputType = {
    totalFeesEarned: Decimal | null
    totalFeesClaimed: Decimal | null
    pendingFees: Decimal | null
    referralCount: number | null
  }

  export type ReferralAccountMinAggregateOutputType = {
    id: string | null
    walletAddress: string | null
    totalFeesEarned: Decimal | null
    totalFeesClaimed: Decimal | null
    pendingFees: Decimal | null
    referralCount: number | null
    lastClaimedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReferralAccountMaxAggregateOutputType = {
    id: string | null
    walletAddress: string | null
    totalFeesEarned: Decimal | null
    totalFeesClaimed: Decimal | null
    pendingFees: Decimal | null
    referralCount: number | null
    lastClaimedAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type ReferralAccountCountAggregateOutputType = {
    id: number
    walletAddress: number
    totalFeesEarned: number
    totalFeesClaimed: number
    pendingFees: number
    referralCount: number
    lastClaimedAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type ReferralAccountAvgAggregateInputType = {
    totalFeesEarned?: true
    totalFeesClaimed?: true
    pendingFees?: true
    referralCount?: true
  }

  export type ReferralAccountSumAggregateInputType = {
    totalFeesEarned?: true
    totalFeesClaimed?: true
    pendingFees?: true
    referralCount?: true
  }

  export type ReferralAccountMinAggregateInputType = {
    id?: true
    walletAddress?: true
    totalFeesEarned?: true
    totalFeesClaimed?: true
    pendingFees?: true
    referralCount?: true
    lastClaimedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReferralAccountMaxAggregateInputType = {
    id?: true
    walletAddress?: true
    totalFeesEarned?: true
    totalFeesClaimed?: true
    pendingFees?: true
    referralCount?: true
    lastClaimedAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type ReferralAccountCountAggregateInputType = {
    id?: true
    walletAddress?: true
    totalFeesEarned?: true
    totalFeesClaimed?: true
    pendingFees?: true
    referralCount?: true
    lastClaimedAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type ReferralAccountAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReferralAccount to aggregate.
     */
    where?: ReferralAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralAccounts to fetch.
     */
    orderBy?: ReferralAccountOrderByWithRelationInput | ReferralAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: ReferralAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned ReferralAccounts
    **/
    _count?: true | ReferralAccountCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: ReferralAccountAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: ReferralAccountSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: ReferralAccountMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: ReferralAccountMaxAggregateInputType
  }

  export type GetReferralAccountAggregateType<T extends ReferralAccountAggregateArgs> = {
        [P in keyof T & keyof AggregateReferralAccount]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateReferralAccount[P]>
      : GetScalarType<T[P], AggregateReferralAccount[P]>
  }




  export type ReferralAccountGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: ReferralAccountWhereInput
    orderBy?: ReferralAccountOrderByWithAggregationInput | ReferralAccountOrderByWithAggregationInput[]
    by: ReferralAccountScalarFieldEnum[] | ReferralAccountScalarFieldEnum
    having?: ReferralAccountScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: ReferralAccountCountAggregateInputType | true
    _avg?: ReferralAccountAvgAggregateInputType
    _sum?: ReferralAccountSumAggregateInputType
    _min?: ReferralAccountMinAggregateInputType
    _max?: ReferralAccountMaxAggregateInputType
  }

  export type ReferralAccountGroupByOutputType = {
    id: string
    walletAddress: string
    totalFeesEarned: Decimal
    totalFeesClaimed: Decimal
    pendingFees: Decimal
    referralCount: number
    lastClaimedAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: ReferralAccountCountAggregateOutputType | null
    _avg: ReferralAccountAvgAggregateOutputType | null
    _sum: ReferralAccountSumAggregateOutputType | null
    _min: ReferralAccountMinAggregateOutputType | null
    _max: ReferralAccountMaxAggregateOutputType | null
  }

  type GetReferralAccountGroupByPayload<T extends ReferralAccountGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<ReferralAccountGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof ReferralAccountGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], ReferralAccountGroupByOutputType[P]>
            : GetScalarType<T[P], ReferralAccountGroupByOutputType[P]>
        }
      >
    >


  export type ReferralAccountSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    totalFeesEarned?: boolean
    totalFeesClaimed?: boolean
    pendingFees?: boolean
    referralCount?: boolean
    lastClaimedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["referralAccount"]>

  export type ReferralAccountSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    totalFeesEarned?: boolean
    totalFeesClaimed?: boolean
    pendingFees?: boolean
    referralCount?: boolean
    lastClaimedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["referralAccount"]>

  export type ReferralAccountSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    totalFeesEarned?: boolean
    totalFeesClaimed?: boolean
    pendingFees?: boolean
    referralCount?: boolean
    lastClaimedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["referralAccount"]>

  export type ReferralAccountSelectScalar = {
    id?: boolean
    walletAddress?: boolean
    totalFeesEarned?: boolean
    totalFeesClaimed?: boolean
    pendingFees?: boolean
    referralCount?: boolean
    lastClaimedAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type ReferralAccountOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "walletAddress" | "totalFeesEarned" | "totalFeesClaimed" | "pendingFees" | "referralCount" | "lastClaimedAt" | "createdAt" | "updatedAt", ExtArgs["result"]["referralAccount"]>

  export type $ReferralAccountPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "ReferralAccount"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      walletAddress: string
      totalFeesEarned: Prisma.Decimal
      totalFeesClaimed: Prisma.Decimal
      pendingFees: Prisma.Decimal
      referralCount: number
      lastClaimedAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["referralAccount"]>
    composites: {}
  }

  type ReferralAccountGetPayload<S extends boolean | null | undefined | ReferralAccountDefaultArgs> = $Result.GetResult<Prisma.$ReferralAccountPayload, S>

  type ReferralAccountCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<ReferralAccountFindManyArgs, 'select' | 'include' | 'distinct' | 'omit' | 'relationLoadStrategy'> & {
      select?: ReferralAccountCountAggregateInputType | true
    }

  export interface ReferralAccountDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['ReferralAccount'], meta: { name: 'ReferralAccount' } }
    /**
     * Find zero or one ReferralAccount that matches the filter.
     * @param {ReferralAccountFindUniqueArgs} args - Arguments to find a ReferralAccount
     * @example
     * // Get one ReferralAccount
     * const referralAccount = await prisma.referralAccount.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends ReferralAccountFindUniqueArgs>(args: SelectSubset<T, ReferralAccountFindUniqueArgs<ExtArgs>>): Prisma__ReferralAccountClient<$Result.GetResult<Prisma.$ReferralAccountPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one ReferralAccount that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {ReferralAccountFindUniqueOrThrowArgs} args - Arguments to find a ReferralAccount
     * @example
     * // Get one ReferralAccount
     * const referralAccount = await prisma.referralAccount.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends ReferralAccountFindUniqueOrThrowArgs>(args: SelectSubset<T, ReferralAccountFindUniqueOrThrowArgs<ExtArgs>>): Prisma__ReferralAccountClient<$Result.GetResult<Prisma.$ReferralAccountPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ReferralAccount that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralAccountFindFirstArgs} args - Arguments to find a ReferralAccount
     * @example
     * // Get one ReferralAccount
     * const referralAccount = await prisma.referralAccount.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends ReferralAccountFindFirstArgs>(args?: SelectSubset<T, ReferralAccountFindFirstArgs<ExtArgs>>): Prisma__ReferralAccountClient<$Result.GetResult<Prisma.$ReferralAccountPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first ReferralAccount that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralAccountFindFirstOrThrowArgs} args - Arguments to find a ReferralAccount
     * @example
     * // Get one ReferralAccount
     * const referralAccount = await prisma.referralAccount.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends ReferralAccountFindFirstOrThrowArgs>(args?: SelectSubset<T, ReferralAccountFindFirstOrThrowArgs<ExtArgs>>): Prisma__ReferralAccountClient<$Result.GetResult<Prisma.$ReferralAccountPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more ReferralAccounts that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralAccountFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all ReferralAccounts
     * const referralAccounts = await prisma.referralAccount.findMany()
     * 
     * // Get first 10 ReferralAccounts
     * const referralAccounts = await prisma.referralAccount.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const referralAccountWithIdOnly = await prisma.referralAccount.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends ReferralAccountFindManyArgs>(args?: SelectSubset<T, ReferralAccountFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralAccountPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a ReferralAccount.
     * @param {ReferralAccountCreateArgs} args - Arguments to create a ReferralAccount.
     * @example
     * // Create one ReferralAccount
     * const ReferralAccount = await prisma.referralAccount.create({
     *   data: {
     *     // ... data to create a ReferralAccount
     *   }
     * })
     * 
     */
    create<T extends ReferralAccountCreateArgs>(args: SelectSubset<T, ReferralAccountCreateArgs<ExtArgs>>): Prisma__ReferralAccountClient<$Result.GetResult<Prisma.$ReferralAccountPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many ReferralAccounts.
     * @param {ReferralAccountCreateManyArgs} args - Arguments to create many ReferralAccounts.
     * @example
     * // Create many ReferralAccounts
     * const referralAccount = await prisma.referralAccount.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends ReferralAccountCreateManyArgs>(args?: SelectSubset<T, ReferralAccountCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many ReferralAccounts and returns the data saved in the database.
     * @param {ReferralAccountCreateManyAndReturnArgs} args - Arguments to create many ReferralAccounts.
     * @example
     * // Create many ReferralAccounts
     * const referralAccount = await prisma.referralAccount.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many ReferralAccounts and only return the `id`
     * const referralAccountWithIdOnly = await prisma.referralAccount.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends ReferralAccountCreateManyAndReturnArgs>(args?: SelectSubset<T, ReferralAccountCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralAccountPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a ReferralAccount.
     * @param {ReferralAccountDeleteArgs} args - Arguments to delete one ReferralAccount.
     * @example
     * // Delete one ReferralAccount
     * const ReferralAccount = await prisma.referralAccount.delete({
     *   where: {
     *     // ... filter to delete one ReferralAccount
     *   }
     * })
     * 
     */
    delete<T extends ReferralAccountDeleteArgs>(args: SelectSubset<T, ReferralAccountDeleteArgs<ExtArgs>>): Prisma__ReferralAccountClient<$Result.GetResult<Prisma.$ReferralAccountPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one ReferralAccount.
     * @param {ReferralAccountUpdateArgs} args - Arguments to update one ReferralAccount.
     * @example
     * // Update one ReferralAccount
     * const referralAccount = await prisma.referralAccount.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends ReferralAccountUpdateArgs>(args: SelectSubset<T, ReferralAccountUpdateArgs<ExtArgs>>): Prisma__ReferralAccountClient<$Result.GetResult<Prisma.$ReferralAccountPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more ReferralAccounts.
     * @param {ReferralAccountDeleteManyArgs} args - Arguments to filter ReferralAccounts to delete.
     * @example
     * // Delete a few ReferralAccounts
     * const { count } = await prisma.referralAccount.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends ReferralAccountDeleteManyArgs>(args?: SelectSubset<T, ReferralAccountDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ReferralAccounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralAccountUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many ReferralAccounts
     * const referralAccount = await prisma.referralAccount.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends ReferralAccountUpdateManyArgs>(args: SelectSubset<T, ReferralAccountUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more ReferralAccounts and returns the data updated in the database.
     * @param {ReferralAccountUpdateManyAndReturnArgs} args - Arguments to update many ReferralAccounts.
     * @example
     * // Update many ReferralAccounts
     * const referralAccount = await prisma.referralAccount.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more ReferralAccounts and only return the `id`
     * const referralAccountWithIdOnly = await prisma.referralAccount.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends ReferralAccountUpdateManyAndReturnArgs>(args: SelectSubset<T, ReferralAccountUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$ReferralAccountPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one ReferralAccount.
     * @param {ReferralAccountUpsertArgs} args - Arguments to update or create a ReferralAccount.
     * @example
     * // Update or create a ReferralAccount
     * const referralAccount = await prisma.referralAccount.upsert({
     *   create: {
     *     // ... data to create a ReferralAccount
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the ReferralAccount we want to update
     *   }
     * })
     */
    upsert<T extends ReferralAccountUpsertArgs>(args: SelectSubset<T, ReferralAccountUpsertArgs<ExtArgs>>): Prisma__ReferralAccountClient<$Result.GetResult<Prisma.$ReferralAccountPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of ReferralAccounts.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralAccountCountArgs} args - Arguments to filter ReferralAccounts to count.
     * @example
     * // Count the number of ReferralAccounts
     * const count = await prisma.referralAccount.count({
     *   where: {
     *     // ... the filter for the ReferralAccounts we want to count
     *   }
     * })
    **/
    count<T extends ReferralAccountCountArgs>(
      args?: Subset<T, ReferralAccountCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], ReferralAccountCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a ReferralAccount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralAccountAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends ReferralAccountAggregateArgs>(args: Subset<T, ReferralAccountAggregateArgs>): Prisma.PrismaPromise<GetReferralAccountAggregateType<T>>

    /**
     * Group by ReferralAccount.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {ReferralAccountGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends ReferralAccountGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: ReferralAccountGroupByArgs['orderBy'] }
        : { orderBy?: ReferralAccountGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, ReferralAccountGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetReferralAccountGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the ReferralAccount model
   */
  readonly fields: ReferralAccountFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for ReferralAccount.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__ReferralAccountClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the ReferralAccount model
   */
  interface ReferralAccountFieldRefs {
    readonly id: FieldRef<"ReferralAccount", 'String'>
    readonly walletAddress: FieldRef<"ReferralAccount", 'String'>
    readonly totalFeesEarned: FieldRef<"ReferralAccount", 'Decimal'>
    readonly totalFeesClaimed: FieldRef<"ReferralAccount", 'Decimal'>
    readonly pendingFees: FieldRef<"ReferralAccount", 'Decimal'>
    readonly referralCount: FieldRef<"ReferralAccount", 'Int'>
    readonly lastClaimedAt: FieldRef<"ReferralAccount", 'DateTime'>
    readonly createdAt: FieldRef<"ReferralAccount", 'DateTime'>
    readonly updatedAt: FieldRef<"ReferralAccount", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * ReferralAccount findUnique
   */
  export type ReferralAccountFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralAccount
     */
    select?: ReferralAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReferralAccount
     */
    omit?: ReferralAccountOmit<ExtArgs> | null
    /**
     * Filter, which ReferralAccount to fetch.
     */
    where: ReferralAccountWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * ReferralAccount findUniqueOrThrow
   */
  export type ReferralAccountFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralAccount
     */
    select?: ReferralAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReferralAccount
     */
    omit?: ReferralAccountOmit<ExtArgs> | null
    /**
     * Filter, which ReferralAccount to fetch.
     */
    where: ReferralAccountWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * ReferralAccount findFirst
   */
  export type ReferralAccountFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralAccount
     */
    select?: ReferralAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReferralAccount
     */
    omit?: ReferralAccountOmit<ExtArgs> | null
    /**
     * Filter, which ReferralAccount to fetch.
     */
    where?: ReferralAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralAccounts to fetch.
     */
    orderBy?: ReferralAccountOrderByWithRelationInput | ReferralAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReferralAccounts.
     */
    cursor?: ReferralAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReferralAccounts.
     */
    distinct?: ReferralAccountScalarFieldEnum | ReferralAccountScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * ReferralAccount findFirstOrThrow
   */
  export type ReferralAccountFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralAccount
     */
    select?: ReferralAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReferralAccount
     */
    omit?: ReferralAccountOmit<ExtArgs> | null
    /**
     * Filter, which ReferralAccount to fetch.
     */
    where?: ReferralAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralAccounts to fetch.
     */
    orderBy?: ReferralAccountOrderByWithRelationInput | ReferralAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for ReferralAccounts.
     */
    cursor?: ReferralAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralAccounts.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of ReferralAccounts.
     */
    distinct?: ReferralAccountScalarFieldEnum | ReferralAccountScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * ReferralAccount findMany
   */
  export type ReferralAccountFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralAccount
     */
    select?: ReferralAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReferralAccount
     */
    omit?: ReferralAccountOmit<ExtArgs> | null
    /**
     * Filter, which ReferralAccounts to fetch.
     */
    where?: ReferralAccountWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of ReferralAccounts to fetch.
     */
    orderBy?: ReferralAccountOrderByWithRelationInput | ReferralAccountOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing ReferralAccounts.
     */
    cursor?: ReferralAccountWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` ReferralAccounts from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` ReferralAccounts.
     */
    skip?: number
    distinct?: ReferralAccountScalarFieldEnum | ReferralAccountScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * ReferralAccount create
   */
  export type ReferralAccountCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralAccount
     */
    select?: ReferralAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReferralAccount
     */
    omit?: ReferralAccountOmit<ExtArgs> | null
    /**
     * The data needed to create a ReferralAccount.
     */
    data: XOR<ReferralAccountCreateInput, ReferralAccountUncheckedCreateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * ReferralAccount createMany
   */
  export type ReferralAccountCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many ReferralAccounts.
     */
    data: ReferralAccountCreateManyInput | ReferralAccountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReferralAccount createManyAndReturn
   */
  export type ReferralAccountCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralAccount
     */
    select?: ReferralAccountSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ReferralAccount
     */
    omit?: ReferralAccountOmit<ExtArgs> | null
    /**
     * The data used to create many ReferralAccounts.
     */
    data: ReferralAccountCreateManyInput | ReferralAccountCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * ReferralAccount update
   */
  export type ReferralAccountUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralAccount
     */
    select?: ReferralAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReferralAccount
     */
    omit?: ReferralAccountOmit<ExtArgs> | null
    /**
     * The data needed to update a ReferralAccount.
     */
    data: XOR<ReferralAccountUpdateInput, ReferralAccountUncheckedUpdateInput>
    /**
     * Choose, which ReferralAccount to update.
     */
    where: ReferralAccountWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * ReferralAccount updateMany
   */
  export type ReferralAccountUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update ReferralAccounts.
     */
    data: XOR<ReferralAccountUpdateManyMutationInput, ReferralAccountUncheckedUpdateManyInput>
    /**
     * Filter which ReferralAccounts to update
     */
    where?: ReferralAccountWhereInput
    /**
     * Limit how many ReferralAccounts to update.
     */
    limit?: number
  }

  /**
   * ReferralAccount updateManyAndReturn
   */
  export type ReferralAccountUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralAccount
     */
    select?: ReferralAccountSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the ReferralAccount
     */
    omit?: ReferralAccountOmit<ExtArgs> | null
    /**
     * The data used to update ReferralAccounts.
     */
    data: XOR<ReferralAccountUpdateManyMutationInput, ReferralAccountUncheckedUpdateManyInput>
    /**
     * Filter which ReferralAccounts to update
     */
    where?: ReferralAccountWhereInput
    /**
     * Limit how many ReferralAccounts to update.
     */
    limit?: number
  }

  /**
   * ReferralAccount upsert
   */
  export type ReferralAccountUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralAccount
     */
    select?: ReferralAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReferralAccount
     */
    omit?: ReferralAccountOmit<ExtArgs> | null
    /**
     * The filter to search for the ReferralAccount to update in case it exists.
     */
    where: ReferralAccountWhereUniqueInput
    /**
     * In case the ReferralAccount found by the `where` argument doesn't exist, create a new ReferralAccount with this data.
     */
    create: XOR<ReferralAccountCreateInput, ReferralAccountUncheckedCreateInput>
    /**
     * In case the ReferralAccount was found with the provided `where` argument, update it with this data.
     */
    update: XOR<ReferralAccountUpdateInput, ReferralAccountUncheckedUpdateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * ReferralAccount delete
   */
  export type ReferralAccountDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralAccount
     */
    select?: ReferralAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReferralAccount
     */
    omit?: ReferralAccountOmit<ExtArgs> | null
    /**
     * Filter which ReferralAccount to delete.
     */
    where: ReferralAccountWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * ReferralAccount deleteMany
   */
  export type ReferralAccountDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which ReferralAccounts to delete
     */
    where?: ReferralAccountWhereInput
    /**
     * Limit how many ReferralAccounts to delete.
     */
    limit?: number
  }

  /**
   * ReferralAccount without action
   */
  export type ReferralAccountDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the ReferralAccount
     */
    select?: ReferralAccountSelect<ExtArgs> | null
    /**
     * Omit specific fields from the ReferralAccount
     */
    omit?: ReferralAccountOmit<ExtArgs> | null
  }


  /**
   * Model TreasuryEvent
   */

  export type AggregateTreasuryEvent = {
    _count: TreasuryEventCountAggregateOutputType | null
    _avg: TreasuryEventAvgAggregateOutputType | null
    _sum: TreasuryEventSumAggregateOutputType | null
    _min: TreasuryEventMinAggregateOutputType | null
    _max: TreasuryEventMaxAggregateOutputType | null
  }

  export type TreasuryEventAvgAggregateOutputType = {
    amountLamports: Decimal | null
    cumulativeTotal: Decimal | null
  }

  export type TreasuryEventSumAggregateOutputType = {
    amountLamports: Decimal | null
    cumulativeTotal: Decimal | null
  }

  export type TreasuryEventMinAggregateOutputType = {
    id: string | null
    eventType: string | null
    coinId: string | null
    txSignature: string | null
    amountLamports: Decimal | null
    cumulativeTotal: Decimal | null
    memo: string | null
    createdAt: Date | null
  }

  export type TreasuryEventMaxAggregateOutputType = {
    id: string | null
    eventType: string | null
    coinId: string | null
    txSignature: string | null
    amountLamports: Decimal | null
    cumulativeTotal: Decimal | null
    memo: string | null
    createdAt: Date | null
  }

  export type TreasuryEventCountAggregateOutputType = {
    id: number
    eventType: number
    coinId: number
    txSignature: number
    amountLamports: number
    cumulativeTotal: number
    memo: number
    createdAt: number
    _all: number
  }


  export type TreasuryEventAvgAggregateInputType = {
    amountLamports?: true
    cumulativeTotal?: true
  }

  export type TreasuryEventSumAggregateInputType = {
    amountLamports?: true
    cumulativeTotal?: true
  }

  export type TreasuryEventMinAggregateInputType = {
    id?: true
    eventType?: true
    coinId?: true
    txSignature?: true
    amountLamports?: true
    cumulativeTotal?: true
    memo?: true
    createdAt?: true
  }

  export type TreasuryEventMaxAggregateInputType = {
    id?: true
    eventType?: true
    coinId?: true
    txSignature?: true
    amountLamports?: true
    cumulativeTotal?: true
    memo?: true
    createdAt?: true
  }

  export type TreasuryEventCountAggregateInputType = {
    id?: true
    eventType?: true
    coinId?: true
    txSignature?: true
    amountLamports?: true
    cumulativeTotal?: true
    memo?: true
    createdAt?: true
    _all?: true
  }

  export type TreasuryEventAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TreasuryEvent to aggregate.
     */
    where?: TreasuryEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TreasuryEvents to fetch.
     */
    orderBy?: TreasuryEventOrderByWithRelationInput | TreasuryEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: TreasuryEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TreasuryEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TreasuryEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned TreasuryEvents
    **/
    _count?: true | TreasuryEventCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: TreasuryEventAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: TreasuryEventSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: TreasuryEventMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: TreasuryEventMaxAggregateInputType
  }

  export type GetTreasuryEventAggregateType<T extends TreasuryEventAggregateArgs> = {
        [P in keyof T & keyof AggregateTreasuryEvent]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateTreasuryEvent[P]>
      : GetScalarType<T[P], AggregateTreasuryEvent[P]>
  }




  export type TreasuryEventGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: TreasuryEventWhereInput
    orderBy?: TreasuryEventOrderByWithAggregationInput | TreasuryEventOrderByWithAggregationInput[]
    by: TreasuryEventScalarFieldEnum[] | TreasuryEventScalarFieldEnum
    having?: TreasuryEventScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: TreasuryEventCountAggregateInputType | true
    _avg?: TreasuryEventAvgAggregateInputType
    _sum?: TreasuryEventSumAggregateInputType
    _min?: TreasuryEventMinAggregateInputType
    _max?: TreasuryEventMaxAggregateInputType
  }

  export type TreasuryEventGroupByOutputType = {
    id: string
    eventType: string
    coinId: string | null
    txSignature: string | null
    amountLamports: Decimal
    cumulativeTotal: Decimal
    memo: string | null
    createdAt: Date
    _count: TreasuryEventCountAggregateOutputType | null
    _avg: TreasuryEventAvgAggregateOutputType | null
    _sum: TreasuryEventSumAggregateOutputType | null
    _min: TreasuryEventMinAggregateOutputType | null
    _max: TreasuryEventMaxAggregateOutputType | null
  }

  type GetTreasuryEventGroupByPayload<T extends TreasuryEventGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<TreasuryEventGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof TreasuryEventGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], TreasuryEventGroupByOutputType[P]>
            : GetScalarType<T[P], TreasuryEventGroupByOutputType[P]>
        }
      >
    >


  export type TreasuryEventSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventType?: boolean
    coinId?: boolean
    txSignature?: boolean
    amountLamports?: boolean
    cumulativeTotal?: boolean
    memo?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["treasuryEvent"]>

  export type TreasuryEventSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventType?: boolean
    coinId?: boolean
    txSignature?: boolean
    amountLamports?: boolean
    cumulativeTotal?: boolean
    memo?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["treasuryEvent"]>

  export type TreasuryEventSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    eventType?: boolean
    coinId?: boolean
    txSignature?: boolean
    amountLamports?: boolean
    cumulativeTotal?: boolean
    memo?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["treasuryEvent"]>

  export type TreasuryEventSelectScalar = {
    id?: boolean
    eventType?: boolean
    coinId?: boolean
    txSignature?: boolean
    amountLamports?: boolean
    cumulativeTotal?: boolean
    memo?: boolean
    createdAt?: boolean
  }

  export type TreasuryEventOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "eventType" | "coinId" | "txSignature" | "amountLamports" | "cumulativeTotal" | "memo" | "createdAt", ExtArgs["result"]["treasuryEvent"]>

  export type $TreasuryEventPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "TreasuryEvent"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      eventType: string
      coinId: string | null
      txSignature: string | null
      amountLamports: Prisma.Decimal
      cumulativeTotal: Prisma.Decimal
      memo: string | null
      createdAt: Date
    }, ExtArgs["result"]["treasuryEvent"]>
    composites: {}
  }

  type TreasuryEventGetPayload<S extends boolean | null | undefined | TreasuryEventDefaultArgs> = $Result.GetResult<Prisma.$TreasuryEventPayload, S>

  type TreasuryEventCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<TreasuryEventFindManyArgs, 'select' | 'include' | 'distinct' | 'omit' | 'relationLoadStrategy'> & {
      select?: TreasuryEventCountAggregateInputType | true
    }

  export interface TreasuryEventDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['TreasuryEvent'], meta: { name: 'TreasuryEvent' } }
    /**
     * Find zero or one TreasuryEvent that matches the filter.
     * @param {TreasuryEventFindUniqueArgs} args - Arguments to find a TreasuryEvent
     * @example
     * // Get one TreasuryEvent
     * const treasuryEvent = await prisma.treasuryEvent.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends TreasuryEventFindUniqueArgs>(args: SelectSubset<T, TreasuryEventFindUniqueArgs<ExtArgs>>): Prisma__TreasuryEventClient<$Result.GetResult<Prisma.$TreasuryEventPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one TreasuryEvent that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {TreasuryEventFindUniqueOrThrowArgs} args - Arguments to find a TreasuryEvent
     * @example
     * // Get one TreasuryEvent
     * const treasuryEvent = await prisma.treasuryEvent.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends TreasuryEventFindUniqueOrThrowArgs>(args: SelectSubset<T, TreasuryEventFindUniqueOrThrowArgs<ExtArgs>>): Prisma__TreasuryEventClient<$Result.GetResult<Prisma.$TreasuryEventPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TreasuryEvent that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TreasuryEventFindFirstArgs} args - Arguments to find a TreasuryEvent
     * @example
     * // Get one TreasuryEvent
     * const treasuryEvent = await prisma.treasuryEvent.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends TreasuryEventFindFirstArgs>(args?: SelectSubset<T, TreasuryEventFindFirstArgs<ExtArgs>>): Prisma__TreasuryEventClient<$Result.GetResult<Prisma.$TreasuryEventPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first TreasuryEvent that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TreasuryEventFindFirstOrThrowArgs} args - Arguments to find a TreasuryEvent
     * @example
     * // Get one TreasuryEvent
     * const treasuryEvent = await prisma.treasuryEvent.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends TreasuryEventFindFirstOrThrowArgs>(args?: SelectSubset<T, TreasuryEventFindFirstOrThrowArgs<ExtArgs>>): Prisma__TreasuryEventClient<$Result.GetResult<Prisma.$TreasuryEventPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more TreasuryEvents that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TreasuryEventFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all TreasuryEvents
     * const treasuryEvents = await prisma.treasuryEvent.findMany()
     * 
     * // Get first 10 TreasuryEvents
     * const treasuryEvents = await prisma.treasuryEvent.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const treasuryEventWithIdOnly = await prisma.treasuryEvent.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends TreasuryEventFindManyArgs>(args?: SelectSubset<T, TreasuryEventFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TreasuryEventPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a TreasuryEvent.
     * @param {TreasuryEventCreateArgs} args - Arguments to create a TreasuryEvent.
     * @example
     * // Create one TreasuryEvent
     * const TreasuryEvent = await prisma.treasuryEvent.create({
     *   data: {
     *     // ... data to create a TreasuryEvent
     *   }
     * })
     * 
     */
    create<T extends TreasuryEventCreateArgs>(args: SelectSubset<T, TreasuryEventCreateArgs<ExtArgs>>): Prisma__TreasuryEventClient<$Result.GetResult<Prisma.$TreasuryEventPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many TreasuryEvents.
     * @param {TreasuryEventCreateManyArgs} args - Arguments to create many TreasuryEvents.
     * @example
     * // Create many TreasuryEvents
     * const treasuryEvent = await prisma.treasuryEvent.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends TreasuryEventCreateManyArgs>(args?: SelectSubset<T, TreasuryEventCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many TreasuryEvents and returns the data saved in the database.
     * @param {TreasuryEventCreateManyAndReturnArgs} args - Arguments to create many TreasuryEvents.
     * @example
     * // Create many TreasuryEvents
     * const treasuryEvent = await prisma.treasuryEvent.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many TreasuryEvents and only return the `id`
     * const treasuryEventWithIdOnly = await prisma.treasuryEvent.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends TreasuryEventCreateManyAndReturnArgs>(args?: SelectSubset<T, TreasuryEventCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TreasuryEventPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a TreasuryEvent.
     * @param {TreasuryEventDeleteArgs} args - Arguments to delete one TreasuryEvent.
     * @example
     * // Delete one TreasuryEvent
     * const TreasuryEvent = await prisma.treasuryEvent.delete({
     *   where: {
     *     // ... filter to delete one TreasuryEvent
     *   }
     * })
     * 
     */
    delete<T extends TreasuryEventDeleteArgs>(args: SelectSubset<T, TreasuryEventDeleteArgs<ExtArgs>>): Prisma__TreasuryEventClient<$Result.GetResult<Prisma.$TreasuryEventPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one TreasuryEvent.
     * @param {TreasuryEventUpdateArgs} args - Arguments to update one TreasuryEvent.
     * @example
     * // Update one TreasuryEvent
     * const treasuryEvent = await prisma.treasuryEvent.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends TreasuryEventUpdateArgs>(args: SelectSubset<T, TreasuryEventUpdateArgs<ExtArgs>>): Prisma__TreasuryEventClient<$Result.GetResult<Prisma.$TreasuryEventPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more TreasuryEvents.
     * @param {TreasuryEventDeleteManyArgs} args - Arguments to filter TreasuryEvents to delete.
     * @example
     * // Delete a few TreasuryEvents
     * const { count } = await prisma.treasuryEvent.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends TreasuryEventDeleteManyArgs>(args?: SelectSubset<T, TreasuryEventDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TreasuryEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TreasuryEventUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many TreasuryEvents
     * const treasuryEvent = await prisma.treasuryEvent.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends TreasuryEventUpdateManyArgs>(args: SelectSubset<T, TreasuryEventUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more TreasuryEvents and returns the data updated in the database.
     * @param {TreasuryEventUpdateManyAndReturnArgs} args - Arguments to update many TreasuryEvents.
     * @example
     * // Update many TreasuryEvents
     * const treasuryEvent = await prisma.treasuryEvent.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more TreasuryEvents and only return the `id`
     * const treasuryEventWithIdOnly = await prisma.treasuryEvent.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends TreasuryEventUpdateManyAndReturnArgs>(args: SelectSubset<T, TreasuryEventUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$TreasuryEventPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one TreasuryEvent.
     * @param {TreasuryEventUpsertArgs} args - Arguments to update or create a TreasuryEvent.
     * @example
     * // Update or create a TreasuryEvent
     * const treasuryEvent = await prisma.treasuryEvent.upsert({
     *   create: {
     *     // ... data to create a TreasuryEvent
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the TreasuryEvent we want to update
     *   }
     * })
     */
    upsert<T extends TreasuryEventUpsertArgs>(args: SelectSubset<T, TreasuryEventUpsertArgs<ExtArgs>>): Prisma__TreasuryEventClient<$Result.GetResult<Prisma.$TreasuryEventPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of TreasuryEvents.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TreasuryEventCountArgs} args - Arguments to filter TreasuryEvents to count.
     * @example
     * // Count the number of TreasuryEvents
     * const count = await prisma.treasuryEvent.count({
     *   where: {
     *     // ... the filter for the TreasuryEvents we want to count
     *   }
     * })
    **/
    count<T extends TreasuryEventCountArgs>(
      args?: Subset<T, TreasuryEventCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], TreasuryEventCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a TreasuryEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TreasuryEventAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends TreasuryEventAggregateArgs>(args: Subset<T, TreasuryEventAggregateArgs>): Prisma.PrismaPromise<GetTreasuryEventAggregateType<T>>

    /**
     * Group by TreasuryEvent.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {TreasuryEventGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends TreasuryEventGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: TreasuryEventGroupByArgs['orderBy'] }
        : { orderBy?: TreasuryEventGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, TreasuryEventGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetTreasuryEventGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the TreasuryEvent model
   */
  readonly fields: TreasuryEventFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for TreasuryEvent.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__TreasuryEventClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the TreasuryEvent model
   */
  interface TreasuryEventFieldRefs {
    readonly id: FieldRef<"TreasuryEvent", 'String'>
    readonly eventType: FieldRef<"TreasuryEvent", 'String'>
    readonly coinId: FieldRef<"TreasuryEvent", 'String'>
    readonly txSignature: FieldRef<"TreasuryEvent", 'String'>
    readonly amountLamports: FieldRef<"TreasuryEvent", 'Decimal'>
    readonly cumulativeTotal: FieldRef<"TreasuryEvent", 'Decimal'>
    readonly memo: FieldRef<"TreasuryEvent", 'String'>
    readonly createdAt: FieldRef<"TreasuryEvent", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * TreasuryEvent findUnique
   */
  export type TreasuryEventFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TreasuryEvent
     */
    select?: TreasuryEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TreasuryEvent
     */
    omit?: TreasuryEventOmit<ExtArgs> | null
    /**
     * Filter, which TreasuryEvent to fetch.
     */
    where: TreasuryEventWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * TreasuryEvent findUniqueOrThrow
   */
  export type TreasuryEventFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TreasuryEvent
     */
    select?: TreasuryEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TreasuryEvent
     */
    omit?: TreasuryEventOmit<ExtArgs> | null
    /**
     * Filter, which TreasuryEvent to fetch.
     */
    where: TreasuryEventWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * TreasuryEvent findFirst
   */
  export type TreasuryEventFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TreasuryEvent
     */
    select?: TreasuryEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TreasuryEvent
     */
    omit?: TreasuryEventOmit<ExtArgs> | null
    /**
     * Filter, which TreasuryEvent to fetch.
     */
    where?: TreasuryEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TreasuryEvents to fetch.
     */
    orderBy?: TreasuryEventOrderByWithRelationInput | TreasuryEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TreasuryEvents.
     */
    cursor?: TreasuryEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TreasuryEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TreasuryEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TreasuryEvents.
     */
    distinct?: TreasuryEventScalarFieldEnum | TreasuryEventScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * TreasuryEvent findFirstOrThrow
   */
  export type TreasuryEventFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TreasuryEvent
     */
    select?: TreasuryEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TreasuryEvent
     */
    omit?: TreasuryEventOmit<ExtArgs> | null
    /**
     * Filter, which TreasuryEvent to fetch.
     */
    where?: TreasuryEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TreasuryEvents to fetch.
     */
    orderBy?: TreasuryEventOrderByWithRelationInput | TreasuryEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for TreasuryEvents.
     */
    cursor?: TreasuryEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TreasuryEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TreasuryEvents.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of TreasuryEvents.
     */
    distinct?: TreasuryEventScalarFieldEnum | TreasuryEventScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * TreasuryEvent findMany
   */
  export type TreasuryEventFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TreasuryEvent
     */
    select?: TreasuryEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TreasuryEvent
     */
    omit?: TreasuryEventOmit<ExtArgs> | null
    /**
     * Filter, which TreasuryEvents to fetch.
     */
    where?: TreasuryEventWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of TreasuryEvents to fetch.
     */
    orderBy?: TreasuryEventOrderByWithRelationInput | TreasuryEventOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing TreasuryEvents.
     */
    cursor?: TreasuryEventWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` TreasuryEvents from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` TreasuryEvents.
     */
    skip?: number
    distinct?: TreasuryEventScalarFieldEnum | TreasuryEventScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * TreasuryEvent create
   */
  export type TreasuryEventCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TreasuryEvent
     */
    select?: TreasuryEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TreasuryEvent
     */
    omit?: TreasuryEventOmit<ExtArgs> | null
    /**
     * The data needed to create a TreasuryEvent.
     */
    data: XOR<TreasuryEventCreateInput, TreasuryEventUncheckedCreateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * TreasuryEvent createMany
   */
  export type TreasuryEventCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many TreasuryEvents.
     */
    data: TreasuryEventCreateManyInput | TreasuryEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TreasuryEvent createManyAndReturn
   */
  export type TreasuryEventCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TreasuryEvent
     */
    select?: TreasuryEventSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TreasuryEvent
     */
    omit?: TreasuryEventOmit<ExtArgs> | null
    /**
     * The data used to create many TreasuryEvents.
     */
    data: TreasuryEventCreateManyInput | TreasuryEventCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * TreasuryEvent update
   */
  export type TreasuryEventUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TreasuryEvent
     */
    select?: TreasuryEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TreasuryEvent
     */
    omit?: TreasuryEventOmit<ExtArgs> | null
    /**
     * The data needed to update a TreasuryEvent.
     */
    data: XOR<TreasuryEventUpdateInput, TreasuryEventUncheckedUpdateInput>
    /**
     * Choose, which TreasuryEvent to update.
     */
    where: TreasuryEventWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * TreasuryEvent updateMany
   */
  export type TreasuryEventUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update TreasuryEvents.
     */
    data: XOR<TreasuryEventUpdateManyMutationInput, TreasuryEventUncheckedUpdateManyInput>
    /**
     * Filter which TreasuryEvents to update
     */
    where?: TreasuryEventWhereInput
    /**
     * Limit how many TreasuryEvents to update.
     */
    limit?: number
  }

  /**
   * TreasuryEvent updateManyAndReturn
   */
  export type TreasuryEventUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TreasuryEvent
     */
    select?: TreasuryEventSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the TreasuryEvent
     */
    omit?: TreasuryEventOmit<ExtArgs> | null
    /**
     * The data used to update TreasuryEvents.
     */
    data: XOR<TreasuryEventUpdateManyMutationInput, TreasuryEventUncheckedUpdateManyInput>
    /**
     * Filter which TreasuryEvents to update
     */
    where?: TreasuryEventWhereInput
    /**
     * Limit how many TreasuryEvents to update.
     */
    limit?: number
  }

  /**
   * TreasuryEvent upsert
   */
  export type TreasuryEventUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TreasuryEvent
     */
    select?: TreasuryEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TreasuryEvent
     */
    omit?: TreasuryEventOmit<ExtArgs> | null
    /**
     * The filter to search for the TreasuryEvent to update in case it exists.
     */
    where: TreasuryEventWhereUniqueInput
    /**
     * In case the TreasuryEvent found by the `where` argument doesn't exist, create a new TreasuryEvent with this data.
     */
    create: XOR<TreasuryEventCreateInput, TreasuryEventUncheckedCreateInput>
    /**
     * In case the TreasuryEvent was found with the provided `where` argument, update it with this data.
     */
    update: XOR<TreasuryEventUpdateInput, TreasuryEventUncheckedUpdateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * TreasuryEvent delete
   */
  export type TreasuryEventDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TreasuryEvent
     */
    select?: TreasuryEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TreasuryEvent
     */
    omit?: TreasuryEventOmit<ExtArgs> | null
    /**
     * Filter which TreasuryEvent to delete.
     */
    where: TreasuryEventWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * TreasuryEvent deleteMany
   */
  export type TreasuryEventDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which TreasuryEvents to delete
     */
    where?: TreasuryEventWhereInput
    /**
     * Limit how many TreasuryEvents to delete.
     */
    limit?: number
  }

  /**
   * TreasuryEvent without action
   */
  export type TreasuryEventDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the TreasuryEvent
     */
    select?: TreasuryEventSelect<ExtArgs> | null
    /**
     * Omit specific fields from the TreasuryEvent
     */
    omit?: TreasuryEventOmit<ExtArgs> | null
  }


  /**
   * Model AuditLog
   */

  export type AggregateAuditLog = {
    _count: AuditLogCountAggregateOutputType | null
    _avg: AuditLogAvgAggregateOutputType | null
    _sum: AuditLogSumAggregateOutputType | null
    _min: AuditLogMinAggregateOutputType | null
    _max: AuditLogMaxAggregateOutputType | null
  }

  export type AuditLogAvgAggregateOutputType = {
    id: number | null
  }

  export type AuditLogSumAggregateOutputType = {
    id: bigint | null
  }

  export type AuditLogMinAggregateOutputType = {
    id: bigint | null
    action: $Enums.AuditAction | null
    actorWallet: string | null
    targetId: string | null
    txSignature: string | null
    ipAddress: string | null
    userAgent: string | null
    createdAt: Date | null
  }

  export type AuditLogMaxAggregateOutputType = {
    id: bigint | null
    action: $Enums.AuditAction | null
    actorWallet: string | null
    targetId: string | null
    txSignature: string | null
    ipAddress: string | null
    userAgent: string | null
    createdAt: Date | null
  }

  export type AuditLogCountAggregateOutputType = {
    id: number
    action: number
    actorWallet: number
    targetId: number
    oldValue: number
    newValue: number
    txSignature: number
    ipAddress: number
    userAgent: number
    createdAt: number
    _all: number
  }


  export type AuditLogAvgAggregateInputType = {
    id?: true
  }

  export type AuditLogSumAggregateInputType = {
    id?: true
  }

  export type AuditLogMinAggregateInputType = {
    id?: true
    action?: true
    actorWallet?: true
    targetId?: true
    txSignature?: true
    ipAddress?: true
    userAgent?: true
    createdAt?: true
  }

  export type AuditLogMaxAggregateInputType = {
    id?: true
    action?: true
    actorWallet?: true
    targetId?: true
    txSignature?: true
    ipAddress?: true
    userAgent?: true
    createdAt?: true
  }

  export type AuditLogCountAggregateInputType = {
    id?: true
    action?: true
    actorWallet?: true
    targetId?: true
    oldValue?: true
    newValue?: true
    txSignature?: true
    ipAddress?: true
    userAgent?: true
    createdAt?: true
    _all?: true
  }

  export type AuditLogAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AuditLog to aggregate.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned AuditLogs
    **/
    _count?: true | AuditLogCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AuditLogAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AuditLogSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AuditLogMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AuditLogMaxAggregateInputType
  }

  export type GetAuditLogAggregateType<T extends AuditLogAggregateArgs> = {
        [P in keyof T & keyof AggregateAuditLog]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAuditLog[P]>
      : GetScalarType<T[P], AggregateAuditLog[P]>
  }




  export type AuditLogGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AuditLogWhereInput
    orderBy?: AuditLogOrderByWithAggregationInput | AuditLogOrderByWithAggregationInput[]
    by: AuditLogScalarFieldEnum[] | AuditLogScalarFieldEnum
    having?: AuditLogScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AuditLogCountAggregateInputType | true
    _avg?: AuditLogAvgAggregateInputType
    _sum?: AuditLogSumAggregateInputType
    _min?: AuditLogMinAggregateInputType
    _max?: AuditLogMaxAggregateInputType
  }

  export type AuditLogGroupByOutputType = {
    id: bigint
    action: $Enums.AuditAction
    actorWallet: string
    targetId: string | null
    oldValue: JsonValue | null
    newValue: JsonValue | null
    txSignature: string | null
    ipAddress: string | null
    userAgent: string | null
    createdAt: Date
    _count: AuditLogCountAggregateOutputType | null
    _avg: AuditLogAvgAggregateOutputType | null
    _sum: AuditLogSumAggregateOutputType | null
    _min: AuditLogMinAggregateOutputType | null
    _max: AuditLogMaxAggregateOutputType | null
  }

  type GetAuditLogGroupByPayload<T extends AuditLogGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AuditLogGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AuditLogGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AuditLogGroupByOutputType[P]>
            : GetScalarType<T[P], AuditLogGroupByOutputType[P]>
        }
      >
    >


  export type AuditLogSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    action?: boolean
    actorWallet?: boolean
    targetId?: boolean
    oldValue?: boolean
    newValue?: boolean
    txSignature?: boolean
    ipAddress?: boolean
    userAgent?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["auditLog"]>

  export type AuditLogSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    action?: boolean
    actorWallet?: boolean
    targetId?: boolean
    oldValue?: boolean
    newValue?: boolean
    txSignature?: boolean
    ipAddress?: boolean
    userAgent?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["auditLog"]>

  export type AuditLogSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    action?: boolean
    actorWallet?: boolean
    targetId?: boolean
    oldValue?: boolean
    newValue?: boolean
    txSignature?: boolean
    ipAddress?: boolean
    userAgent?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["auditLog"]>

  export type AuditLogSelectScalar = {
    id?: boolean
    action?: boolean
    actorWallet?: boolean
    targetId?: boolean
    oldValue?: boolean
    newValue?: boolean
    txSignature?: boolean
    ipAddress?: boolean
    userAgent?: boolean
    createdAt?: boolean
  }

  export type AuditLogOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "action" | "actorWallet" | "targetId" | "oldValue" | "newValue" | "txSignature" | "ipAddress" | "userAgent" | "createdAt", ExtArgs["result"]["auditLog"]>

  export type $AuditLogPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "AuditLog"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: bigint
      action: $Enums.AuditAction
      actorWallet: string
      targetId: string | null
      oldValue: Prisma.JsonValue | null
      newValue: Prisma.JsonValue | null
      txSignature: string | null
      ipAddress: string | null
      userAgent: string | null
      createdAt: Date
    }, ExtArgs["result"]["auditLog"]>
    composites: {}
  }

  type AuditLogGetPayload<S extends boolean | null | undefined | AuditLogDefaultArgs> = $Result.GetResult<Prisma.$AuditLogPayload, S>

  type AuditLogCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AuditLogFindManyArgs, 'select' | 'include' | 'distinct' | 'omit' | 'relationLoadStrategy'> & {
      select?: AuditLogCountAggregateInputType | true
    }

  export interface AuditLogDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['AuditLog'], meta: { name: 'AuditLog' } }
    /**
     * Find zero or one AuditLog that matches the filter.
     * @param {AuditLogFindUniqueArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AuditLogFindUniqueArgs>(args: SelectSubset<T, AuditLogFindUniqueArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one AuditLog that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AuditLogFindUniqueOrThrowArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AuditLogFindUniqueOrThrowArgs>(args: SelectSubset<T, AuditLogFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AuditLog that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogFindFirstArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AuditLogFindFirstArgs>(args?: SelectSubset<T, AuditLogFindFirstArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first AuditLog that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogFindFirstOrThrowArgs} args - Arguments to find a AuditLog
     * @example
     * // Get one AuditLog
     * const auditLog = await prisma.auditLog.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AuditLogFindFirstOrThrowArgs>(args?: SelectSubset<T, AuditLogFindFirstOrThrowArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more AuditLogs that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all AuditLogs
     * const auditLogs = await prisma.auditLog.findMany()
     * 
     * // Get first 10 AuditLogs
     * const auditLogs = await prisma.auditLog.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const auditLogWithIdOnly = await prisma.auditLog.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AuditLogFindManyArgs>(args?: SelectSubset<T, AuditLogFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a AuditLog.
     * @param {AuditLogCreateArgs} args - Arguments to create a AuditLog.
     * @example
     * // Create one AuditLog
     * const AuditLog = await prisma.auditLog.create({
     *   data: {
     *     // ... data to create a AuditLog
     *   }
     * })
     * 
     */
    create<T extends AuditLogCreateArgs>(args: SelectSubset<T, AuditLogCreateArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many AuditLogs.
     * @param {AuditLogCreateManyArgs} args - Arguments to create many AuditLogs.
     * @example
     * // Create many AuditLogs
     * const auditLog = await prisma.auditLog.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AuditLogCreateManyArgs>(args?: SelectSubset<T, AuditLogCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many AuditLogs and returns the data saved in the database.
     * @param {AuditLogCreateManyAndReturnArgs} args - Arguments to create many AuditLogs.
     * @example
     * // Create many AuditLogs
     * const auditLog = await prisma.auditLog.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many AuditLogs and only return the `id`
     * const auditLogWithIdOnly = await prisma.auditLog.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AuditLogCreateManyAndReturnArgs>(args?: SelectSubset<T, AuditLogCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a AuditLog.
     * @param {AuditLogDeleteArgs} args - Arguments to delete one AuditLog.
     * @example
     * // Delete one AuditLog
     * const AuditLog = await prisma.auditLog.delete({
     *   where: {
     *     // ... filter to delete one AuditLog
     *   }
     * })
     * 
     */
    delete<T extends AuditLogDeleteArgs>(args: SelectSubset<T, AuditLogDeleteArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one AuditLog.
     * @param {AuditLogUpdateArgs} args - Arguments to update one AuditLog.
     * @example
     * // Update one AuditLog
     * const auditLog = await prisma.auditLog.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AuditLogUpdateArgs>(args: SelectSubset<T, AuditLogUpdateArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more AuditLogs.
     * @param {AuditLogDeleteManyArgs} args - Arguments to filter AuditLogs to delete.
     * @example
     * // Delete a few AuditLogs
     * const { count } = await prisma.auditLog.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AuditLogDeleteManyArgs>(args?: SelectSubset<T, AuditLogDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AuditLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many AuditLogs
     * const auditLog = await prisma.auditLog.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AuditLogUpdateManyArgs>(args: SelectSubset<T, AuditLogUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more AuditLogs and returns the data updated in the database.
     * @param {AuditLogUpdateManyAndReturnArgs} args - Arguments to update many AuditLogs.
     * @example
     * // Update many AuditLogs
     * const auditLog = await prisma.auditLog.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more AuditLogs and only return the `id`
     * const auditLogWithIdOnly = await prisma.auditLog.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AuditLogUpdateManyAndReturnArgs>(args: SelectSubset<T, AuditLogUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one AuditLog.
     * @param {AuditLogUpsertArgs} args - Arguments to update or create a AuditLog.
     * @example
     * // Update or create a AuditLog
     * const auditLog = await prisma.auditLog.upsert({
     *   create: {
     *     // ... data to create a AuditLog
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the AuditLog we want to update
     *   }
     * })
     */
    upsert<T extends AuditLogUpsertArgs>(args: SelectSubset<T, AuditLogUpsertArgs<ExtArgs>>): Prisma__AuditLogClient<$Result.GetResult<Prisma.$AuditLogPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of AuditLogs.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogCountArgs} args - Arguments to filter AuditLogs to count.
     * @example
     * // Count the number of AuditLogs
     * const count = await prisma.auditLog.count({
     *   where: {
     *     // ... the filter for the AuditLogs we want to count
     *   }
     * })
    **/
    count<T extends AuditLogCountArgs>(
      args?: Subset<T, AuditLogCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AuditLogCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a AuditLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AuditLogAggregateArgs>(args: Subset<T, AuditLogAggregateArgs>): Prisma.PrismaPromise<GetAuditLogAggregateType<T>>

    /**
     * Group by AuditLog.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AuditLogGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AuditLogGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AuditLogGroupByArgs['orderBy'] }
        : { orderBy?: AuditLogGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AuditLogGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAuditLogGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the AuditLog model
   */
  readonly fields: AuditLogFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for AuditLog.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AuditLogClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the AuditLog model
   */
  interface AuditLogFieldRefs {
    readonly id: FieldRef<"AuditLog", 'BigInt'>
    readonly action: FieldRef<"AuditLog", 'AuditAction'>
    readonly actorWallet: FieldRef<"AuditLog", 'String'>
    readonly targetId: FieldRef<"AuditLog", 'String'>
    readonly oldValue: FieldRef<"AuditLog", 'Json'>
    readonly newValue: FieldRef<"AuditLog", 'Json'>
    readonly txSignature: FieldRef<"AuditLog", 'String'>
    readonly ipAddress: FieldRef<"AuditLog", 'String'>
    readonly userAgent: FieldRef<"AuditLog", 'String'>
    readonly createdAt: FieldRef<"AuditLog", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * AuditLog findUnique
   */
  export type AuditLogFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where: AuditLogWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * AuditLog findUniqueOrThrow
   */
  export type AuditLogFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where: AuditLogWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * AuditLog findFirst
   */
  export type AuditLogFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AuditLogs.
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditLogs.
     */
    distinct?: AuditLogScalarFieldEnum | AuditLogScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * AuditLog findFirstOrThrow
   */
  export type AuditLogFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Filter, which AuditLog to fetch.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for AuditLogs.
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of AuditLogs.
     */
    distinct?: AuditLogScalarFieldEnum | AuditLogScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * AuditLog findMany
   */
  export type AuditLogFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Filter, which AuditLogs to fetch.
     */
    where?: AuditLogWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of AuditLogs to fetch.
     */
    orderBy?: AuditLogOrderByWithRelationInput | AuditLogOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing AuditLogs.
     */
    cursor?: AuditLogWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` AuditLogs from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` AuditLogs.
     */
    skip?: number
    distinct?: AuditLogScalarFieldEnum | AuditLogScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * AuditLog create
   */
  export type AuditLogCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * The data needed to create a AuditLog.
     */
    data: XOR<AuditLogCreateInput, AuditLogUncheckedCreateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * AuditLog createMany
   */
  export type AuditLogCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many AuditLogs.
     */
    data: AuditLogCreateManyInput | AuditLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AuditLog createManyAndReturn
   */
  export type AuditLogCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * The data used to create many AuditLogs.
     */
    data: AuditLogCreateManyInput | AuditLogCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * AuditLog update
   */
  export type AuditLogUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * The data needed to update a AuditLog.
     */
    data: XOR<AuditLogUpdateInput, AuditLogUncheckedUpdateInput>
    /**
     * Choose, which AuditLog to update.
     */
    where: AuditLogWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * AuditLog updateMany
   */
  export type AuditLogUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update AuditLogs.
     */
    data: XOR<AuditLogUpdateManyMutationInput, AuditLogUncheckedUpdateManyInput>
    /**
     * Filter which AuditLogs to update
     */
    where?: AuditLogWhereInput
    /**
     * Limit how many AuditLogs to update.
     */
    limit?: number
  }

  /**
   * AuditLog updateManyAndReturn
   */
  export type AuditLogUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * The data used to update AuditLogs.
     */
    data: XOR<AuditLogUpdateManyMutationInput, AuditLogUncheckedUpdateManyInput>
    /**
     * Filter which AuditLogs to update
     */
    where?: AuditLogWhereInput
    /**
     * Limit how many AuditLogs to update.
     */
    limit?: number
  }

  /**
   * AuditLog upsert
   */
  export type AuditLogUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * The filter to search for the AuditLog to update in case it exists.
     */
    where: AuditLogWhereUniqueInput
    /**
     * In case the AuditLog found by the `where` argument doesn't exist, create a new AuditLog with this data.
     */
    create: XOR<AuditLogCreateInput, AuditLogUncheckedCreateInput>
    /**
     * In case the AuditLog was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AuditLogUpdateInput, AuditLogUncheckedUpdateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * AuditLog delete
   */
  export type AuditLogDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
    /**
     * Filter which AuditLog to delete.
     */
    where: AuditLogWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * AuditLog deleteMany
   */
  export type AuditLogDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which AuditLogs to delete
     */
    where?: AuditLogWhereInput
    /**
     * Limit how many AuditLogs to delete.
     */
    limit?: number
  }

  /**
   * AuditLog without action
   */
  export type AuditLogDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the AuditLog
     */
    select?: AuditLogSelect<ExtArgs> | null
    /**
     * Omit specific fields from the AuditLog
     */
    omit?: AuditLogOmit<ExtArgs> | null
  }


  /**
   * Model IndexerState
   */

  export type AggregateIndexerState = {
    _count: IndexerStateCountAggregateOutputType | null
    _avg: IndexerStateAvgAggregateOutputType | null
    _sum: IndexerStateSumAggregateOutputType | null
    _min: IndexerStateMinAggregateOutputType | null
    _max: IndexerStateMaxAggregateOutputType | null
  }

  export type IndexerStateAvgAggregateOutputType = {
    lastSlot: number | null
  }

  export type IndexerStateSumAggregateOutputType = {
    lastSlot: bigint | null
  }

  export type IndexerStateMinAggregateOutputType = {
    id: string | null
    lastSlot: bigint | null
    lastSignature: string | null
    isHealthy: boolean | null
    errorMessage: string | null
    updatedAt: Date | null
  }

  export type IndexerStateMaxAggregateOutputType = {
    id: string | null
    lastSlot: bigint | null
    lastSignature: string | null
    isHealthy: boolean | null
    errorMessage: string | null
    updatedAt: Date | null
  }

  export type IndexerStateCountAggregateOutputType = {
    id: number
    lastSlot: number
    lastSignature: number
    isHealthy: number
    errorMessage: number
    updatedAt: number
    _all: number
  }


  export type IndexerStateAvgAggregateInputType = {
    lastSlot?: true
  }

  export type IndexerStateSumAggregateInputType = {
    lastSlot?: true
  }

  export type IndexerStateMinAggregateInputType = {
    id?: true
    lastSlot?: true
    lastSignature?: true
    isHealthy?: true
    errorMessage?: true
    updatedAt?: true
  }

  export type IndexerStateMaxAggregateInputType = {
    id?: true
    lastSlot?: true
    lastSignature?: true
    isHealthy?: true
    errorMessage?: true
    updatedAt?: true
  }

  export type IndexerStateCountAggregateInputType = {
    id?: true
    lastSlot?: true
    lastSignature?: true
    isHealthy?: true
    errorMessage?: true
    updatedAt?: true
    _all?: true
  }

  export type IndexerStateAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IndexerState to aggregate.
     */
    where?: IndexerStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IndexerStates to fetch.
     */
    orderBy?: IndexerStateOrderByWithRelationInput | IndexerStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: IndexerStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IndexerStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IndexerStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned IndexerStates
    **/
    _count?: true | IndexerStateCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: IndexerStateAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: IndexerStateSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: IndexerStateMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: IndexerStateMaxAggregateInputType
  }

  export type GetIndexerStateAggregateType<T extends IndexerStateAggregateArgs> = {
        [P in keyof T & keyof AggregateIndexerState]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateIndexerState[P]>
      : GetScalarType<T[P], AggregateIndexerState[P]>
  }




  export type IndexerStateGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: IndexerStateWhereInput
    orderBy?: IndexerStateOrderByWithAggregationInput | IndexerStateOrderByWithAggregationInput[]
    by: IndexerStateScalarFieldEnum[] | IndexerStateScalarFieldEnum
    having?: IndexerStateScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: IndexerStateCountAggregateInputType | true
    _avg?: IndexerStateAvgAggregateInputType
    _sum?: IndexerStateSumAggregateInputType
    _min?: IndexerStateMinAggregateInputType
    _max?: IndexerStateMaxAggregateInputType
  }

  export type IndexerStateGroupByOutputType = {
    id: string
    lastSlot: bigint
    lastSignature: string | null
    isHealthy: boolean
    errorMessage: string | null
    updatedAt: Date
    _count: IndexerStateCountAggregateOutputType | null
    _avg: IndexerStateAvgAggregateOutputType | null
    _sum: IndexerStateSumAggregateOutputType | null
    _min: IndexerStateMinAggregateOutputType | null
    _max: IndexerStateMaxAggregateOutputType | null
  }

  type GetIndexerStateGroupByPayload<T extends IndexerStateGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<IndexerStateGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof IndexerStateGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], IndexerStateGroupByOutputType[P]>
            : GetScalarType<T[P], IndexerStateGroupByOutputType[P]>
        }
      >
    >


  export type IndexerStateSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    lastSlot?: boolean
    lastSignature?: boolean
    isHealthy?: boolean
    errorMessage?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["indexerState"]>

  export type IndexerStateSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    lastSlot?: boolean
    lastSignature?: boolean
    isHealthy?: boolean
    errorMessage?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["indexerState"]>

  export type IndexerStateSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    lastSlot?: boolean
    lastSignature?: boolean
    isHealthy?: boolean
    errorMessage?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["indexerState"]>

  export type IndexerStateSelectScalar = {
    id?: boolean
    lastSlot?: boolean
    lastSignature?: boolean
    isHealthy?: boolean
    errorMessage?: boolean
    updatedAt?: boolean
  }

  export type IndexerStateOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "lastSlot" | "lastSignature" | "isHealthy" | "errorMessage" | "updatedAt", ExtArgs["result"]["indexerState"]>

  export type $IndexerStatePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "IndexerState"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      lastSlot: bigint
      lastSignature: string | null
      isHealthy: boolean
      errorMessage: string | null
      updatedAt: Date
    }, ExtArgs["result"]["indexerState"]>
    composites: {}
  }

  type IndexerStateGetPayload<S extends boolean | null | undefined | IndexerStateDefaultArgs> = $Result.GetResult<Prisma.$IndexerStatePayload, S>

  type IndexerStateCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<IndexerStateFindManyArgs, 'select' | 'include' | 'distinct' | 'omit' | 'relationLoadStrategy'> & {
      select?: IndexerStateCountAggregateInputType | true
    }

  export interface IndexerStateDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['IndexerState'], meta: { name: 'IndexerState' } }
    /**
     * Find zero or one IndexerState that matches the filter.
     * @param {IndexerStateFindUniqueArgs} args - Arguments to find a IndexerState
     * @example
     * // Get one IndexerState
     * const indexerState = await prisma.indexerState.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends IndexerStateFindUniqueArgs>(args: SelectSubset<T, IndexerStateFindUniqueArgs<ExtArgs>>): Prisma__IndexerStateClient<$Result.GetResult<Prisma.$IndexerStatePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one IndexerState that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {IndexerStateFindUniqueOrThrowArgs} args - Arguments to find a IndexerState
     * @example
     * // Get one IndexerState
     * const indexerState = await prisma.indexerState.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends IndexerStateFindUniqueOrThrowArgs>(args: SelectSubset<T, IndexerStateFindUniqueOrThrowArgs<ExtArgs>>): Prisma__IndexerStateClient<$Result.GetResult<Prisma.$IndexerStatePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IndexerState that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IndexerStateFindFirstArgs} args - Arguments to find a IndexerState
     * @example
     * // Get one IndexerState
     * const indexerState = await prisma.indexerState.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends IndexerStateFindFirstArgs>(args?: SelectSubset<T, IndexerStateFindFirstArgs<ExtArgs>>): Prisma__IndexerStateClient<$Result.GetResult<Prisma.$IndexerStatePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first IndexerState that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IndexerStateFindFirstOrThrowArgs} args - Arguments to find a IndexerState
     * @example
     * // Get one IndexerState
     * const indexerState = await prisma.indexerState.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends IndexerStateFindFirstOrThrowArgs>(args?: SelectSubset<T, IndexerStateFindFirstOrThrowArgs<ExtArgs>>): Prisma__IndexerStateClient<$Result.GetResult<Prisma.$IndexerStatePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more IndexerStates that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IndexerStateFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all IndexerStates
     * const indexerStates = await prisma.indexerState.findMany()
     * 
     * // Get first 10 IndexerStates
     * const indexerStates = await prisma.indexerState.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const indexerStateWithIdOnly = await prisma.indexerState.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends IndexerStateFindManyArgs>(args?: SelectSubset<T, IndexerStateFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IndexerStatePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a IndexerState.
     * @param {IndexerStateCreateArgs} args - Arguments to create a IndexerState.
     * @example
     * // Create one IndexerState
     * const IndexerState = await prisma.indexerState.create({
     *   data: {
     *     // ... data to create a IndexerState
     *   }
     * })
     * 
     */
    create<T extends IndexerStateCreateArgs>(args: SelectSubset<T, IndexerStateCreateArgs<ExtArgs>>): Prisma__IndexerStateClient<$Result.GetResult<Prisma.$IndexerStatePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many IndexerStates.
     * @param {IndexerStateCreateManyArgs} args - Arguments to create many IndexerStates.
     * @example
     * // Create many IndexerStates
     * const indexerState = await prisma.indexerState.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends IndexerStateCreateManyArgs>(args?: SelectSubset<T, IndexerStateCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many IndexerStates and returns the data saved in the database.
     * @param {IndexerStateCreateManyAndReturnArgs} args - Arguments to create many IndexerStates.
     * @example
     * // Create many IndexerStates
     * const indexerState = await prisma.indexerState.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many IndexerStates and only return the `id`
     * const indexerStateWithIdOnly = await prisma.indexerState.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends IndexerStateCreateManyAndReturnArgs>(args?: SelectSubset<T, IndexerStateCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IndexerStatePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a IndexerState.
     * @param {IndexerStateDeleteArgs} args - Arguments to delete one IndexerState.
     * @example
     * // Delete one IndexerState
     * const IndexerState = await prisma.indexerState.delete({
     *   where: {
     *     // ... filter to delete one IndexerState
     *   }
     * })
     * 
     */
    delete<T extends IndexerStateDeleteArgs>(args: SelectSubset<T, IndexerStateDeleteArgs<ExtArgs>>): Prisma__IndexerStateClient<$Result.GetResult<Prisma.$IndexerStatePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one IndexerState.
     * @param {IndexerStateUpdateArgs} args - Arguments to update one IndexerState.
     * @example
     * // Update one IndexerState
     * const indexerState = await prisma.indexerState.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends IndexerStateUpdateArgs>(args: SelectSubset<T, IndexerStateUpdateArgs<ExtArgs>>): Prisma__IndexerStateClient<$Result.GetResult<Prisma.$IndexerStatePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more IndexerStates.
     * @param {IndexerStateDeleteManyArgs} args - Arguments to filter IndexerStates to delete.
     * @example
     * // Delete a few IndexerStates
     * const { count } = await prisma.indexerState.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends IndexerStateDeleteManyArgs>(args?: SelectSubset<T, IndexerStateDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IndexerStates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IndexerStateUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many IndexerStates
     * const indexerState = await prisma.indexerState.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends IndexerStateUpdateManyArgs>(args: SelectSubset<T, IndexerStateUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more IndexerStates and returns the data updated in the database.
     * @param {IndexerStateUpdateManyAndReturnArgs} args - Arguments to update many IndexerStates.
     * @example
     * // Update many IndexerStates
     * const indexerState = await prisma.indexerState.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more IndexerStates and only return the `id`
     * const indexerStateWithIdOnly = await prisma.indexerState.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends IndexerStateUpdateManyAndReturnArgs>(args: SelectSubset<T, IndexerStateUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$IndexerStatePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one IndexerState.
     * @param {IndexerStateUpsertArgs} args - Arguments to update or create a IndexerState.
     * @example
     * // Update or create a IndexerState
     * const indexerState = await prisma.indexerState.upsert({
     *   create: {
     *     // ... data to create a IndexerState
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the IndexerState we want to update
     *   }
     * })
     */
    upsert<T extends IndexerStateUpsertArgs>(args: SelectSubset<T, IndexerStateUpsertArgs<ExtArgs>>): Prisma__IndexerStateClient<$Result.GetResult<Prisma.$IndexerStatePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of IndexerStates.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IndexerStateCountArgs} args - Arguments to filter IndexerStates to count.
     * @example
     * // Count the number of IndexerStates
     * const count = await prisma.indexerState.count({
     *   where: {
     *     // ... the filter for the IndexerStates we want to count
     *   }
     * })
    **/
    count<T extends IndexerStateCountArgs>(
      args?: Subset<T, IndexerStateCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], IndexerStateCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a IndexerState.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IndexerStateAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends IndexerStateAggregateArgs>(args: Subset<T, IndexerStateAggregateArgs>): Prisma.PrismaPromise<GetIndexerStateAggregateType<T>>

    /**
     * Group by IndexerState.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {IndexerStateGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends IndexerStateGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: IndexerStateGroupByArgs['orderBy'] }
        : { orderBy?: IndexerStateGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, IndexerStateGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetIndexerStateGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the IndexerState model
   */
  readonly fields: IndexerStateFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for IndexerState.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__IndexerStateClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the IndexerState model
   */
  interface IndexerStateFieldRefs {
    readonly id: FieldRef<"IndexerState", 'String'>
    readonly lastSlot: FieldRef<"IndexerState", 'BigInt'>
    readonly lastSignature: FieldRef<"IndexerState", 'String'>
    readonly isHealthy: FieldRef<"IndexerState", 'Boolean'>
    readonly errorMessage: FieldRef<"IndexerState", 'String'>
    readonly updatedAt: FieldRef<"IndexerState", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * IndexerState findUnique
   */
  export type IndexerStateFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IndexerState
     */
    select?: IndexerStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IndexerState
     */
    omit?: IndexerStateOmit<ExtArgs> | null
    /**
     * Filter, which IndexerState to fetch.
     */
    where: IndexerStateWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * IndexerState findUniqueOrThrow
   */
  export type IndexerStateFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IndexerState
     */
    select?: IndexerStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IndexerState
     */
    omit?: IndexerStateOmit<ExtArgs> | null
    /**
     * Filter, which IndexerState to fetch.
     */
    where: IndexerStateWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * IndexerState findFirst
   */
  export type IndexerStateFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IndexerState
     */
    select?: IndexerStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IndexerState
     */
    omit?: IndexerStateOmit<ExtArgs> | null
    /**
     * Filter, which IndexerState to fetch.
     */
    where?: IndexerStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IndexerStates to fetch.
     */
    orderBy?: IndexerStateOrderByWithRelationInput | IndexerStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IndexerStates.
     */
    cursor?: IndexerStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IndexerStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IndexerStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IndexerStates.
     */
    distinct?: IndexerStateScalarFieldEnum | IndexerStateScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * IndexerState findFirstOrThrow
   */
  export type IndexerStateFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IndexerState
     */
    select?: IndexerStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IndexerState
     */
    omit?: IndexerStateOmit<ExtArgs> | null
    /**
     * Filter, which IndexerState to fetch.
     */
    where?: IndexerStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IndexerStates to fetch.
     */
    orderBy?: IndexerStateOrderByWithRelationInput | IndexerStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for IndexerStates.
     */
    cursor?: IndexerStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IndexerStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IndexerStates.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of IndexerStates.
     */
    distinct?: IndexerStateScalarFieldEnum | IndexerStateScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * IndexerState findMany
   */
  export type IndexerStateFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IndexerState
     */
    select?: IndexerStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IndexerState
     */
    omit?: IndexerStateOmit<ExtArgs> | null
    /**
     * Filter, which IndexerStates to fetch.
     */
    where?: IndexerStateWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of IndexerStates to fetch.
     */
    orderBy?: IndexerStateOrderByWithRelationInput | IndexerStateOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing IndexerStates.
     */
    cursor?: IndexerStateWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` IndexerStates from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` IndexerStates.
     */
    skip?: number
    distinct?: IndexerStateScalarFieldEnum | IndexerStateScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * IndexerState create
   */
  export type IndexerStateCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IndexerState
     */
    select?: IndexerStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IndexerState
     */
    omit?: IndexerStateOmit<ExtArgs> | null
    /**
     * The data needed to create a IndexerState.
     */
    data: XOR<IndexerStateCreateInput, IndexerStateUncheckedCreateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * IndexerState createMany
   */
  export type IndexerStateCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many IndexerStates.
     */
    data: IndexerStateCreateManyInput | IndexerStateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * IndexerState createManyAndReturn
   */
  export type IndexerStateCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IndexerState
     */
    select?: IndexerStateSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IndexerState
     */
    omit?: IndexerStateOmit<ExtArgs> | null
    /**
     * The data used to create many IndexerStates.
     */
    data: IndexerStateCreateManyInput | IndexerStateCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * IndexerState update
   */
  export type IndexerStateUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IndexerState
     */
    select?: IndexerStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IndexerState
     */
    omit?: IndexerStateOmit<ExtArgs> | null
    /**
     * The data needed to update a IndexerState.
     */
    data: XOR<IndexerStateUpdateInput, IndexerStateUncheckedUpdateInput>
    /**
     * Choose, which IndexerState to update.
     */
    where: IndexerStateWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * IndexerState updateMany
   */
  export type IndexerStateUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update IndexerStates.
     */
    data: XOR<IndexerStateUpdateManyMutationInput, IndexerStateUncheckedUpdateManyInput>
    /**
     * Filter which IndexerStates to update
     */
    where?: IndexerStateWhereInput
    /**
     * Limit how many IndexerStates to update.
     */
    limit?: number
  }

  /**
   * IndexerState updateManyAndReturn
   */
  export type IndexerStateUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IndexerState
     */
    select?: IndexerStateSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the IndexerState
     */
    omit?: IndexerStateOmit<ExtArgs> | null
    /**
     * The data used to update IndexerStates.
     */
    data: XOR<IndexerStateUpdateManyMutationInput, IndexerStateUncheckedUpdateManyInput>
    /**
     * Filter which IndexerStates to update
     */
    where?: IndexerStateWhereInput
    /**
     * Limit how many IndexerStates to update.
     */
    limit?: number
  }

  /**
   * IndexerState upsert
   */
  export type IndexerStateUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IndexerState
     */
    select?: IndexerStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IndexerState
     */
    omit?: IndexerStateOmit<ExtArgs> | null
    /**
     * The filter to search for the IndexerState to update in case it exists.
     */
    where: IndexerStateWhereUniqueInput
    /**
     * In case the IndexerState found by the `where` argument doesn't exist, create a new IndexerState with this data.
     */
    create: XOR<IndexerStateCreateInput, IndexerStateUncheckedCreateInput>
    /**
     * In case the IndexerState was found with the provided `where` argument, update it with this data.
     */
    update: XOR<IndexerStateUpdateInput, IndexerStateUncheckedUpdateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * IndexerState delete
   */
  export type IndexerStateDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IndexerState
     */
    select?: IndexerStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IndexerState
     */
    omit?: IndexerStateOmit<ExtArgs> | null
    /**
     * Filter which IndexerState to delete.
     */
    where: IndexerStateWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * IndexerState deleteMany
   */
  export type IndexerStateDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which IndexerStates to delete
     */
    where?: IndexerStateWhereInput
    /**
     * Limit how many IndexerStates to delete.
     */
    limit?: number
  }

  /**
   * IndexerState without action
   */
  export type IndexerStateDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the IndexerState
     */
    select?: IndexerStateSelect<ExtArgs> | null
    /**
     * Omit specific fields from the IndexerState
     */
    omit?: IndexerStateOmit<ExtArgs> | null
  }


  /**
   * Model PendingTx
   */

  export type AggregatePendingTx = {
    _count: PendingTxCountAggregateOutputType | null
    _avg: PendingTxAvgAggregateOutputType | null
    _sum: PendingTxSumAggregateOutputType | null
    _min: PendingTxMinAggregateOutputType | null
    _max: PendingTxMaxAggregateOutputType | null
  }

  export type PendingTxAvgAggregateOutputType = {
    lastValidBlockHeight: number | null
    confirmedSlot: number | null
    submitAttempts: number | null
  }

  export type PendingTxSumAggregateOutputType = {
    lastValidBlockHeight: bigint | null
    confirmedSlot: bigint | null
    submitAttempts: number | null
  }

  export type PendingTxMinAggregateOutputType = {
    id: string | null
    idempotencyKey: string | null
    walletAddress: string | null
    operationType: string | null
    coinId: string | null
    status: $Enums.TxStatus | null
    serializedTx: Bytes | null
    signature: string | null
    blockhash: string | null
    lastValidBlockHeight: bigint | null
    confirmedSlot: bigint | null
    finalizedAt: Date | null
    errorMessage: string | null
    errorCode: string | null
    canResubmit: boolean | null
    submitAttempts: number | null
    lastSubmittedAt: Date | null
    expiresAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PendingTxMaxAggregateOutputType = {
    id: string | null
    idempotencyKey: string | null
    walletAddress: string | null
    operationType: string | null
    coinId: string | null
    status: $Enums.TxStatus | null
    serializedTx: Bytes | null
    signature: string | null
    blockhash: string | null
    lastValidBlockHeight: bigint | null
    confirmedSlot: bigint | null
    finalizedAt: Date | null
    errorMessage: string | null
    errorCode: string | null
    canResubmit: boolean | null
    submitAttempts: number | null
    lastSubmittedAt: Date | null
    expiresAt: Date | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PendingTxCountAggregateOutputType = {
    id: number
    idempotencyKey: number
    walletAddress: number
    operationType: number
    coinId: number
    status: number
    serializedTx: number
    signature: number
    blockhash: number
    lastValidBlockHeight: number
    confirmedSlot: number
    finalizedAt: number
    errorMessage: number
    errorCode: number
    canResubmit: number
    submitAttempts: number
    lastSubmittedAt: number
    expiresAt: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PendingTxAvgAggregateInputType = {
    lastValidBlockHeight?: true
    confirmedSlot?: true
    submitAttempts?: true
  }

  export type PendingTxSumAggregateInputType = {
    lastValidBlockHeight?: true
    confirmedSlot?: true
    submitAttempts?: true
  }

  export type PendingTxMinAggregateInputType = {
    id?: true
    idempotencyKey?: true
    walletAddress?: true
    operationType?: true
    coinId?: true
    status?: true
    serializedTx?: true
    signature?: true
    blockhash?: true
    lastValidBlockHeight?: true
    confirmedSlot?: true
    finalizedAt?: true
    errorMessage?: true
    errorCode?: true
    canResubmit?: true
    submitAttempts?: true
    lastSubmittedAt?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PendingTxMaxAggregateInputType = {
    id?: true
    idempotencyKey?: true
    walletAddress?: true
    operationType?: true
    coinId?: true
    status?: true
    serializedTx?: true
    signature?: true
    blockhash?: true
    lastValidBlockHeight?: true
    confirmedSlot?: true
    finalizedAt?: true
    errorMessage?: true
    errorCode?: true
    canResubmit?: true
    submitAttempts?: true
    lastSubmittedAt?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PendingTxCountAggregateInputType = {
    id?: true
    idempotencyKey?: true
    walletAddress?: true
    operationType?: true
    coinId?: true
    status?: true
    serializedTx?: true
    signature?: true
    blockhash?: true
    lastValidBlockHeight?: true
    confirmedSlot?: true
    finalizedAt?: true
    errorMessage?: true
    errorCode?: true
    canResubmit?: true
    submitAttempts?: true
    lastSubmittedAt?: true
    expiresAt?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PendingTxAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PendingTx to aggregate.
     */
    where?: PendingTxWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PendingTxes to fetch.
     */
    orderBy?: PendingTxOrderByWithRelationInput | PendingTxOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PendingTxWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PendingTxes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PendingTxes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PendingTxes
    **/
    _count?: true | PendingTxCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: PendingTxAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: PendingTxSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PendingTxMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PendingTxMaxAggregateInputType
  }

  export type GetPendingTxAggregateType<T extends PendingTxAggregateArgs> = {
        [P in keyof T & keyof AggregatePendingTx]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePendingTx[P]>
      : GetScalarType<T[P], AggregatePendingTx[P]>
  }




  export type PendingTxGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PendingTxWhereInput
    orderBy?: PendingTxOrderByWithAggregationInput | PendingTxOrderByWithAggregationInput[]
    by: PendingTxScalarFieldEnum[] | PendingTxScalarFieldEnum
    having?: PendingTxScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PendingTxCountAggregateInputType | true
    _avg?: PendingTxAvgAggregateInputType
    _sum?: PendingTxSumAggregateInputType
    _min?: PendingTxMinAggregateInputType
    _max?: PendingTxMaxAggregateInputType
  }

  export type PendingTxGroupByOutputType = {
    id: string
    idempotencyKey: string
    walletAddress: string
    operationType: string
    coinId: string | null
    status: $Enums.TxStatus
    serializedTx: Bytes | null
    signature: string | null
    blockhash: string | null
    lastValidBlockHeight: bigint | null
    confirmedSlot: bigint | null
    finalizedAt: Date | null
    errorMessage: string | null
    errorCode: string | null
    canResubmit: boolean
    submitAttempts: number
    lastSubmittedAt: Date | null
    expiresAt: Date | null
    createdAt: Date
    updatedAt: Date
    _count: PendingTxCountAggregateOutputType | null
    _avg: PendingTxAvgAggregateOutputType | null
    _sum: PendingTxSumAggregateOutputType | null
    _min: PendingTxMinAggregateOutputType | null
    _max: PendingTxMaxAggregateOutputType | null
  }

  type GetPendingTxGroupByPayload<T extends PendingTxGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PendingTxGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PendingTxGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PendingTxGroupByOutputType[P]>
            : GetScalarType<T[P], PendingTxGroupByOutputType[P]>
        }
      >
    >


  export type PendingTxSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    idempotencyKey?: boolean
    walletAddress?: boolean
    operationType?: boolean
    coinId?: boolean
    status?: boolean
    serializedTx?: boolean
    signature?: boolean
    blockhash?: boolean
    lastValidBlockHeight?: boolean
    confirmedSlot?: boolean
    finalizedAt?: boolean
    errorMessage?: boolean
    errorCode?: boolean
    canResubmit?: boolean
    submitAttempts?: boolean
    lastSubmittedAt?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pendingTx"]>

  export type PendingTxSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    idempotencyKey?: boolean
    walletAddress?: boolean
    operationType?: boolean
    coinId?: boolean
    status?: boolean
    serializedTx?: boolean
    signature?: boolean
    blockhash?: boolean
    lastValidBlockHeight?: boolean
    confirmedSlot?: boolean
    finalizedAt?: boolean
    errorMessage?: boolean
    errorCode?: boolean
    canResubmit?: boolean
    submitAttempts?: boolean
    lastSubmittedAt?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pendingTx"]>

  export type PendingTxSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    idempotencyKey?: boolean
    walletAddress?: boolean
    operationType?: boolean
    coinId?: boolean
    status?: boolean
    serializedTx?: boolean
    signature?: boolean
    blockhash?: boolean
    lastValidBlockHeight?: boolean
    confirmedSlot?: boolean
    finalizedAt?: boolean
    errorMessage?: boolean
    errorCode?: boolean
    canResubmit?: boolean
    submitAttempts?: boolean
    lastSubmittedAt?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pendingTx"]>

  export type PendingTxSelectScalar = {
    id?: boolean
    idempotencyKey?: boolean
    walletAddress?: boolean
    operationType?: boolean
    coinId?: boolean
    status?: boolean
    serializedTx?: boolean
    signature?: boolean
    blockhash?: boolean
    lastValidBlockHeight?: boolean
    confirmedSlot?: boolean
    finalizedAt?: boolean
    errorMessage?: boolean
    errorCode?: boolean
    canResubmit?: boolean
    submitAttempts?: boolean
    lastSubmittedAt?: boolean
    expiresAt?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PendingTxOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "idempotencyKey" | "walletAddress" | "operationType" | "coinId" | "status" | "serializedTx" | "signature" | "blockhash" | "lastValidBlockHeight" | "confirmedSlot" | "finalizedAt" | "errorMessage" | "errorCode" | "canResubmit" | "submitAttempts" | "lastSubmittedAt" | "expiresAt" | "createdAt" | "updatedAt", ExtArgs["result"]["pendingTx"]>

  export type $PendingTxPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PendingTx"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      /**
       * Caller-supplied idempotency key — prevents duplicate submissions.
       */
      idempotencyKey: string
      walletAddress: string
      /**
       * BUY | SELL | CREATE_COIN | INITIATE_GRADUATION | COMPLETE_GRADUATION
       */
      operationType: string
      coinId: string | null
      status: $Enums.TxStatus
      /**
       * Serialized VersionedTransaction bytes — set when status = PENDING.
       */
      serializedTx: Prisma.Bytes | null
      /**
       * Base-58 signature — set when status = SUBMITTED.
       */
      signature: string | null
      blockhash: string | null
      lastValidBlockHeight: bigint | null
      confirmedSlot: bigint | null
      finalizedAt: Date | null
      errorMessage: string | null
      errorCode: string | null
      /**
       * When true, this record is eligible to be reset to BUILDING for re-submission.
       */
      canResubmit: boolean
      submitAttempts: number
      lastSubmittedAt: Date | null
      /**
       * Optional hard deadline — TxConfirmer marks SUBMITTED rows EXPIRED after this.
       */
      expiresAt: Date | null
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["pendingTx"]>
    composites: {}
  }

  type PendingTxGetPayload<S extends boolean | null | undefined | PendingTxDefaultArgs> = $Result.GetResult<Prisma.$PendingTxPayload, S>

  type PendingTxCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PendingTxFindManyArgs, 'select' | 'include' | 'distinct' | 'omit' | 'relationLoadStrategy'> & {
      select?: PendingTxCountAggregateInputType | true
    }

  export interface PendingTxDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PendingTx'], meta: { name: 'PendingTx' } }
    /**
     * Find zero or one PendingTx that matches the filter.
     * @param {PendingTxFindUniqueArgs} args - Arguments to find a PendingTx
     * @example
     * // Get one PendingTx
     * const pendingTx = await prisma.pendingTx.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PendingTxFindUniqueArgs>(args: SelectSubset<T, PendingTxFindUniqueArgs<ExtArgs>>): Prisma__PendingTxClient<$Result.GetResult<Prisma.$PendingTxPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PendingTx that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PendingTxFindUniqueOrThrowArgs} args - Arguments to find a PendingTx
     * @example
     * // Get one PendingTx
     * const pendingTx = await prisma.pendingTx.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PendingTxFindUniqueOrThrowArgs>(args: SelectSubset<T, PendingTxFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PendingTxClient<$Result.GetResult<Prisma.$PendingTxPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PendingTx that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PendingTxFindFirstArgs} args - Arguments to find a PendingTx
     * @example
     * // Get one PendingTx
     * const pendingTx = await prisma.pendingTx.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PendingTxFindFirstArgs>(args?: SelectSubset<T, PendingTxFindFirstArgs<ExtArgs>>): Prisma__PendingTxClient<$Result.GetResult<Prisma.$PendingTxPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PendingTx that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PendingTxFindFirstOrThrowArgs} args - Arguments to find a PendingTx
     * @example
     * // Get one PendingTx
     * const pendingTx = await prisma.pendingTx.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PendingTxFindFirstOrThrowArgs>(args?: SelectSubset<T, PendingTxFindFirstOrThrowArgs<ExtArgs>>): Prisma__PendingTxClient<$Result.GetResult<Prisma.$PendingTxPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PendingTxes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PendingTxFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PendingTxes
     * const pendingTxes = await prisma.pendingTx.findMany()
     * 
     * // Get first 10 PendingTxes
     * const pendingTxes = await prisma.pendingTx.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pendingTxWithIdOnly = await prisma.pendingTx.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PendingTxFindManyArgs>(args?: SelectSubset<T, PendingTxFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PendingTxPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PendingTx.
     * @param {PendingTxCreateArgs} args - Arguments to create a PendingTx.
     * @example
     * // Create one PendingTx
     * const PendingTx = await prisma.pendingTx.create({
     *   data: {
     *     // ... data to create a PendingTx
     *   }
     * })
     * 
     */
    create<T extends PendingTxCreateArgs>(args: SelectSubset<T, PendingTxCreateArgs<ExtArgs>>): Prisma__PendingTxClient<$Result.GetResult<Prisma.$PendingTxPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PendingTxes.
     * @param {PendingTxCreateManyArgs} args - Arguments to create many PendingTxes.
     * @example
     * // Create many PendingTxes
     * const pendingTx = await prisma.pendingTx.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PendingTxCreateManyArgs>(args?: SelectSubset<T, PendingTxCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PendingTxes and returns the data saved in the database.
     * @param {PendingTxCreateManyAndReturnArgs} args - Arguments to create many PendingTxes.
     * @example
     * // Create many PendingTxes
     * const pendingTx = await prisma.pendingTx.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PendingTxes and only return the `id`
     * const pendingTxWithIdOnly = await prisma.pendingTx.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PendingTxCreateManyAndReturnArgs>(args?: SelectSubset<T, PendingTxCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PendingTxPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PendingTx.
     * @param {PendingTxDeleteArgs} args - Arguments to delete one PendingTx.
     * @example
     * // Delete one PendingTx
     * const PendingTx = await prisma.pendingTx.delete({
     *   where: {
     *     // ... filter to delete one PendingTx
     *   }
     * })
     * 
     */
    delete<T extends PendingTxDeleteArgs>(args: SelectSubset<T, PendingTxDeleteArgs<ExtArgs>>): Prisma__PendingTxClient<$Result.GetResult<Prisma.$PendingTxPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PendingTx.
     * @param {PendingTxUpdateArgs} args - Arguments to update one PendingTx.
     * @example
     * // Update one PendingTx
     * const pendingTx = await prisma.pendingTx.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PendingTxUpdateArgs>(args: SelectSubset<T, PendingTxUpdateArgs<ExtArgs>>): Prisma__PendingTxClient<$Result.GetResult<Prisma.$PendingTxPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PendingTxes.
     * @param {PendingTxDeleteManyArgs} args - Arguments to filter PendingTxes to delete.
     * @example
     * // Delete a few PendingTxes
     * const { count } = await prisma.pendingTx.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PendingTxDeleteManyArgs>(args?: SelectSubset<T, PendingTxDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PendingTxes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PendingTxUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PendingTxes
     * const pendingTx = await prisma.pendingTx.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PendingTxUpdateManyArgs>(args: SelectSubset<T, PendingTxUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PendingTxes and returns the data updated in the database.
     * @param {PendingTxUpdateManyAndReturnArgs} args - Arguments to update many PendingTxes.
     * @example
     * // Update many PendingTxes
     * const pendingTx = await prisma.pendingTx.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PendingTxes and only return the `id`
     * const pendingTxWithIdOnly = await prisma.pendingTx.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PendingTxUpdateManyAndReturnArgs>(args: SelectSubset<T, PendingTxUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PendingTxPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PendingTx.
     * @param {PendingTxUpsertArgs} args - Arguments to update or create a PendingTx.
     * @example
     * // Update or create a PendingTx
     * const pendingTx = await prisma.pendingTx.upsert({
     *   create: {
     *     // ... data to create a PendingTx
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PendingTx we want to update
     *   }
     * })
     */
    upsert<T extends PendingTxUpsertArgs>(args: SelectSubset<T, PendingTxUpsertArgs<ExtArgs>>): Prisma__PendingTxClient<$Result.GetResult<Prisma.$PendingTxPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PendingTxes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PendingTxCountArgs} args - Arguments to filter PendingTxes to count.
     * @example
     * // Count the number of PendingTxes
     * const count = await prisma.pendingTx.count({
     *   where: {
     *     // ... the filter for the PendingTxes we want to count
     *   }
     * })
    **/
    count<T extends PendingTxCountArgs>(
      args?: Subset<T, PendingTxCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PendingTxCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PendingTx.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PendingTxAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PendingTxAggregateArgs>(args: Subset<T, PendingTxAggregateArgs>): Prisma.PrismaPromise<GetPendingTxAggregateType<T>>

    /**
     * Group by PendingTx.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PendingTxGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PendingTxGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PendingTxGroupByArgs['orderBy'] }
        : { orderBy?: PendingTxGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PendingTxGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPendingTxGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PendingTx model
   */
  readonly fields: PendingTxFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PendingTx.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PendingTxClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PendingTx model
   */
  interface PendingTxFieldRefs {
    readonly id: FieldRef<"PendingTx", 'String'>
    readonly idempotencyKey: FieldRef<"PendingTx", 'String'>
    readonly walletAddress: FieldRef<"PendingTx", 'String'>
    readonly operationType: FieldRef<"PendingTx", 'String'>
    readonly coinId: FieldRef<"PendingTx", 'String'>
    readonly status: FieldRef<"PendingTx", 'TxStatus'>
    readonly serializedTx: FieldRef<"PendingTx", 'Bytes'>
    readonly signature: FieldRef<"PendingTx", 'String'>
    readonly blockhash: FieldRef<"PendingTx", 'String'>
    readonly lastValidBlockHeight: FieldRef<"PendingTx", 'BigInt'>
    readonly confirmedSlot: FieldRef<"PendingTx", 'BigInt'>
    readonly finalizedAt: FieldRef<"PendingTx", 'DateTime'>
    readonly errorMessage: FieldRef<"PendingTx", 'String'>
    readonly errorCode: FieldRef<"PendingTx", 'String'>
    readonly canResubmit: FieldRef<"PendingTx", 'Boolean'>
    readonly submitAttempts: FieldRef<"PendingTx", 'Int'>
    readonly lastSubmittedAt: FieldRef<"PendingTx", 'DateTime'>
    readonly expiresAt: FieldRef<"PendingTx", 'DateTime'>
    readonly createdAt: FieldRef<"PendingTx", 'DateTime'>
    readonly updatedAt: FieldRef<"PendingTx", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PendingTx findUnique
   */
  export type PendingTxFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PendingTx
     */
    select?: PendingTxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PendingTx
     */
    omit?: PendingTxOmit<ExtArgs> | null
    /**
     * Filter, which PendingTx to fetch.
     */
    where: PendingTxWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PendingTx findUniqueOrThrow
   */
  export type PendingTxFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PendingTx
     */
    select?: PendingTxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PendingTx
     */
    omit?: PendingTxOmit<ExtArgs> | null
    /**
     * Filter, which PendingTx to fetch.
     */
    where: PendingTxWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PendingTx findFirst
   */
  export type PendingTxFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PendingTx
     */
    select?: PendingTxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PendingTx
     */
    omit?: PendingTxOmit<ExtArgs> | null
    /**
     * Filter, which PendingTx to fetch.
     */
    where?: PendingTxWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PendingTxes to fetch.
     */
    orderBy?: PendingTxOrderByWithRelationInput | PendingTxOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PendingTxes.
     */
    cursor?: PendingTxWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PendingTxes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PendingTxes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PendingTxes.
     */
    distinct?: PendingTxScalarFieldEnum | PendingTxScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PendingTx findFirstOrThrow
   */
  export type PendingTxFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PendingTx
     */
    select?: PendingTxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PendingTx
     */
    omit?: PendingTxOmit<ExtArgs> | null
    /**
     * Filter, which PendingTx to fetch.
     */
    where?: PendingTxWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PendingTxes to fetch.
     */
    orderBy?: PendingTxOrderByWithRelationInput | PendingTxOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PendingTxes.
     */
    cursor?: PendingTxWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PendingTxes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PendingTxes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PendingTxes.
     */
    distinct?: PendingTxScalarFieldEnum | PendingTxScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PendingTx findMany
   */
  export type PendingTxFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PendingTx
     */
    select?: PendingTxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PendingTx
     */
    omit?: PendingTxOmit<ExtArgs> | null
    /**
     * Filter, which PendingTxes to fetch.
     */
    where?: PendingTxWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PendingTxes to fetch.
     */
    orderBy?: PendingTxOrderByWithRelationInput | PendingTxOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PendingTxes.
     */
    cursor?: PendingTxWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PendingTxes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PendingTxes.
     */
    skip?: number
    distinct?: PendingTxScalarFieldEnum | PendingTxScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PendingTx create
   */
  export type PendingTxCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PendingTx
     */
    select?: PendingTxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PendingTx
     */
    omit?: PendingTxOmit<ExtArgs> | null
    /**
     * The data needed to create a PendingTx.
     */
    data: XOR<PendingTxCreateInput, PendingTxUncheckedCreateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PendingTx createMany
   */
  export type PendingTxCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PendingTxes.
     */
    data: PendingTxCreateManyInput | PendingTxCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PendingTx createManyAndReturn
   */
  export type PendingTxCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PendingTx
     */
    select?: PendingTxSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PendingTx
     */
    omit?: PendingTxOmit<ExtArgs> | null
    /**
     * The data used to create many PendingTxes.
     */
    data: PendingTxCreateManyInput | PendingTxCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PendingTx update
   */
  export type PendingTxUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PendingTx
     */
    select?: PendingTxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PendingTx
     */
    omit?: PendingTxOmit<ExtArgs> | null
    /**
     * The data needed to update a PendingTx.
     */
    data: XOR<PendingTxUpdateInput, PendingTxUncheckedUpdateInput>
    /**
     * Choose, which PendingTx to update.
     */
    where: PendingTxWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PendingTx updateMany
   */
  export type PendingTxUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PendingTxes.
     */
    data: XOR<PendingTxUpdateManyMutationInput, PendingTxUncheckedUpdateManyInput>
    /**
     * Filter which PendingTxes to update
     */
    where?: PendingTxWhereInput
    /**
     * Limit how many PendingTxes to update.
     */
    limit?: number
  }

  /**
   * PendingTx updateManyAndReturn
   */
  export type PendingTxUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PendingTx
     */
    select?: PendingTxSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PendingTx
     */
    omit?: PendingTxOmit<ExtArgs> | null
    /**
     * The data used to update PendingTxes.
     */
    data: XOR<PendingTxUpdateManyMutationInput, PendingTxUncheckedUpdateManyInput>
    /**
     * Filter which PendingTxes to update
     */
    where?: PendingTxWhereInput
    /**
     * Limit how many PendingTxes to update.
     */
    limit?: number
  }

  /**
   * PendingTx upsert
   */
  export type PendingTxUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PendingTx
     */
    select?: PendingTxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PendingTx
     */
    omit?: PendingTxOmit<ExtArgs> | null
    /**
     * The filter to search for the PendingTx to update in case it exists.
     */
    where: PendingTxWhereUniqueInput
    /**
     * In case the PendingTx found by the `where` argument doesn't exist, create a new PendingTx with this data.
     */
    create: XOR<PendingTxCreateInput, PendingTxUncheckedCreateInput>
    /**
     * In case the PendingTx was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PendingTxUpdateInput, PendingTxUncheckedUpdateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PendingTx delete
   */
  export type PendingTxDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PendingTx
     */
    select?: PendingTxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PendingTx
     */
    omit?: PendingTxOmit<ExtArgs> | null
    /**
     * Filter which PendingTx to delete.
     */
    where: PendingTxWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PendingTx deleteMany
   */
  export type PendingTxDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PendingTxes to delete
     */
    where?: PendingTxWhereInput
    /**
     * Limit how many PendingTxes to delete.
     */
    limit?: number
  }

  /**
   * PendingTx without action
   */
  export type PendingTxDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PendingTx
     */
    select?: PendingTxSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PendingTx
     */
    omit?: PendingTxOmit<ExtArgs> | null
  }


  /**
   * Model PushSubscription
   */

  export type AggregatePushSubscription = {
    _count: PushSubscriptionCountAggregateOutputType | null
    _min: PushSubscriptionMinAggregateOutputType | null
    _max: PushSubscriptionMaxAggregateOutputType | null
  }

  export type PushSubscriptionMinAggregateOutputType = {
    id: string | null
    walletAddress: string | null
    platform: string | null
    token: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PushSubscriptionMaxAggregateOutputType = {
    id: string | null
    walletAddress: string | null
    platform: string | null
    token: string | null
    isActive: boolean | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type PushSubscriptionCountAggregateOutputType = {
    id: number
    walletAddress: number
    platform: number
    token: number
    isActive: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type PushSubscriptionMinAggregateInputType = {
    id?: true
    walletAddress?: true
    platform?: true
    token?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PushSubscriptionMaxAggregateInputType = {
    id?: true
    walletAddress?: true
    platform?: true
    token?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
  }

  export type PushSubscriptionCountAggregateInputType = {
    id?: true
    walletAddress?: true
    platform?: true
    token?: true
    isActive?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type PushSubscriptionAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PushSubscription to aggregate.
     */
    where?: PushSubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PushSubscriptions to fetch.
     */
    orderBy?: PushSubscriptionOrderByWithRelationInput | PushSubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: PushSubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PushSubscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PushSubscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned PushSubscriptions
    **/
    _count?: true | PushSubscriptionCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: PushSubscriptionMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: PushSubscriptionMaxAggregateInputType
  }

  export type GetPushSubscriptionAggregateType<T extends PushSubscriptionAggregateArgs> = {
        [P in keyof T & keyof AggregatePushSubscription]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregatePushSubscription[P]>
      : GetScalarType<T[P], AggregatePushSubscription[P]>
  }




  export type PushSubscriptionGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: PushSubscriptionWhereInput
    orderBy?: PushSubscriptionOrderByWithAggregationInput | PushSubscriptionOrderByWithAggregationInput[]
    by: PushSubscriptionScalarFieldEnum[] | PushSubscriptionScalarFieldEnum
    having?: PushSubscriptionScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: PushSubscriptionCountAggregateInputType | true
    _min?: PushSubscriptionMinAggregateInputType
    _max?: PushSubscriptionMaxAggregateInputType
  }

  export type PushSubscriptionGroupByOutputType = {
    id: string
    walletAddress: string
    platform: string
    token: string
    isActive: boolean
    createdAt: Date
    updatedAt: Date
    _count: PushSubscriptionCountAggregateOutputType | null
    _min: PushSubscriptionMinAggregateOutputType | null
    _max: PushSubscriptionMaxAggregateOutputType | null
  }

  type GetPushSubscriptionGroupByPayload<T extends PushSubscriptionGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<PushSubscriptionGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof PushSubscriptionGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], PushSubscriptionGroupByOutputType[P]>
            : GetScalarType<T[P], PushSubscriptionGroupByOutputType[P]>
        }
      >
    >


  export type PushSubscriptionSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    platform?: boolean
    token?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pushSubscription"]>

  export type PushSubscriptionSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    platform?: boolean
    token?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pushSubscription"]>

  export type PushSubscriptionSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    platform?: boolean
    token?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["pushSubscription"]>

  export type PushSubscriptionSelectScalar = {
    id?: boolean
    walletAddress?: boolean
    platform?: boolean
    token?: boolean
    isActive?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type PushSubscriptionOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "walletAddress" | "platform" | "token" | "isActive" | "createdAt" | "updatedAt", ExtArgs["result"]["pushSubscription"]>

  export type $PushSubscriptionPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "PushSubscription"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      walletAddress: string
      platform: string
      token: string
      isActive: boolean
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["pushSubscription"]>
    composites: {}
  }

  type PushSubscriptionGetPayload<S extends boolean | null | undefined | PushSubscriptionDefaultArgs> = $Result.GetResult<Prisma.$PushSubscriptionPayload, S>

  type PushSubscriptionCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<PushSubscriptionFindManyArgs, 'select' | 'include' | 'distinct' | 'omit' | 'relationLoadStrategy'> & {
      select?: PushSubscriptionCountAggregateInputType | true
    }

  export interface PushSubscriptionDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['PushSubscription'], meta: { name: 'PushSubscription' } }
    /**
     * Find zero or one PushSubscription that matches the filter.
     * @param {PushSubscriptionFindUniqueArgs} args - Arguments to find a PushSubscription
     * @example
     * // Get one PushSubscription
     * const pushSubscription = await prisma.pushSubscription.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends PushSubscriptionFindUniqueArgs>(args: SelectSubset<T, PushSubscriptionFindUniqueArgs<ExtArgs>>): Prisma__PushSubscriptionClient<$Result.GetResult<Prisma.$PushSubscriptionPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one PushSubscription that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {PushSubscriptionFindUniqueOrThrowArgs} args - Arguments to find a PushSubscription
     * @example
     * // Get one PushSubscription
     * const pushSubscription = await prisma.pushSubscription.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends PushSubscriptionFindUniqueOrThrowArgs>(args: SelectSubset<T, PushSubscriptionFindUniqueOrThrowArgs<ExtArgs>>): Prisma__PushSubscriptionClient<$Result.GetResult<Prisma.$PushSubscriptionPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PushSubscription that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PushSubscriptionFindFirstArgs} args - Arguments to find a PushSubscription
     * @example
     * // Get one PushSubscription
     * const pushSubscription = await prisma.pushSubscription.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends PushSubscriptionFindFirstArgs>(args?: SelectSubset<T, PushSubscriptionFindFirstArgs<ExtArgs>>): Prisma__PushSubscriptionClient<$Result.GetResult<Prisma.$PushSubscriptionPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first PushSubscription that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PushSubscriptionFindFirstOrThrowArgs} args - Arguments to find a PushSubscription
     * @example
     * // Get one PushSubscription
     * const pushSubscription = await prisma.pushSubscription.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends PushSubscriptionFindFirstOrThrowArgs>(args?: SelectSubset<T, PushSubscriptionFindFirstOrThrowArgs<ExtArgs>>): Prisma__PushSubscriptionClient<$Result.GetResult<Prisma.$PushSubscriptionPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more PushSubscriptions that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PushSubscriptionFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all PushSubscriptions
     * const pushSubscriptions = await prisma.pushSubscription.findMany()
     * 
     * // Get first 10 PushSubscriptions
     * const pushSubscriptions = await prisma.pushSubscription.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const pushSubscriptionWithIdOnly = await prisma.pushSubscription.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends PushSubscriptionFindManyArgs>(args?: SelectSubset<T, PushSubscriptionFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PushSubscriptionPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a PushSubscription.
     * @param {PushSubscriptionCreateArgs} args - Arguments to create a PushSubscription.
     * @example
     * // Create one PushSubscription
     * const PushSubscription = await prisma.pushSubscription.create({
     *   data: {
     *     // ... data to create a PushSubscription
     *   }
     * })
     * 
     */
    create<T extends PushSubscriptionCreateArgs>(args: SelectSubset<T, PushSubscriptionCreateArgs<ExtArgs>>): Prisma__PushSubscriptionClient<$Result.GetResult<Prisma.$PushSubscriptionPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many PushSubscriptions.
     * @param {PushSubscriptionCreateManyArgs} args - Arguments to create many PushSubscriptions.
     * @example
     * // Create many PushSubscriptions
     * const pushSubscription = await prisma.pushSubscription.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends PushSubscriptionCreateManyArgs>(args?: SelectSubset<T, PushSubscriptionCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many PushSubscriptions and returns the data saved in the database.
     * @param {PushSubscriptionCreateManyAndReturnArgs} args - Arguments to create many PushSubscriptions.
     * @example
     * // Create many PushSubscriptions
     * const pushSubscription = await prisma.pushSubscription.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many PushSubscriptions and only return the `id`
     * const pushSubscriptionWithIdOnly = await prisma.pushSubscription.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends PushSubscriptionCreateManyAndReturnArgs>(args?: SelectSubset<T, PushSubscriptionCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PushSubscriptionPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a PushSubscription.
     * @param {PushSubscriptionDeleteArgs} args - Arguments to delete one PushSubscription.
     * @example
     * // Delete one PushSubscription
     * const PushSubscription = await prisma.pushSubscription.delete({
     *   where: {
     *     // ... filter to delete one PushSubscription
     *   }
     * })
     * 
     */
    delete<T extends PushSubscriptionDeleteArgs>(args: SelectSubset<T, PushSubscriptionDeleteArgs<ExtArgs>>): Prisma__PushSubscriptionClient<$Result.GetResult<Prisma.$PushSubscriptionPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one PushSubscription.
     * @param {PushSubscriptionUpdateArgs} args - Arguments to update one PushSubscription.
     * @example
     * // Update one PushSubscription
     * const pushSubscription = await prisma.pushSubscription.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends PushSubscriptionUpdateArgs>(args: SelectSubset<T, PushSubscriptionUpdateArgs<ExtArgs>>): Prisma__PushSubscriptionClient<$Result.GetResult<Prisma.$PushSubscriptionPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more PushSubscriptions.
     * @param {PushSubscriptionDeleteManyArgs} args - Arguments to filter PushSubscriptions to delete.
     * @example
     * // Delete a few PushSubscriptions
     * const { count } = await prisma.pushSubscription.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends PushSubscriptionDeleteManyArgs>(args?: SelectSubset<T, PushSubscriptionDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PushSubscriptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PushSubscriptionUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many PushSubscriptions
     * const pushSubscription = await prisma.pushSubscription.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends PushSubscriptionUpdateManyArgs>(args: SelectSubset<T, PushSubscriptionUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more PushSubscriptions and returns the data updated in the database.
     * @param {PushSubscriptionUpdateManyAndReturnArgs} args - Arguments to update many PushSubscriptions.
     * @example
     * // Update many PushSubscriptions
     * const pushSubscription = await prisma.pushSubscription.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more PushSubscriptions and only return the `id`
     * const pushSubscriptionWithIdOnly = await prisma.pushSubscription.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends PushSubscriptionUpdateManyAndReturnArgs>(args: SelectSubset<T, PushSubscriptionUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$PushSubscriptionPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one PushSubscription.
     * @param {PushSubscriptionUpsertArgs} args - Arguments to update or create a PushSubscription.
     * @example
     * // Update or create a PushSubscription
     * const pushSubscription = await prisma.pushSubscription.upsert({
     *   create: {
     *     // ... data to create a PushSubscription
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the PushSubscription we want to update
     *   }
     * })
     */
    upsert<T extends PushSubscriptionUpsertArgs>(args: SelectSubset<T, PushSubscriptionUpsertArgs<ExtArgs>>): Prisma__PushSubscriptionClient<$Result.GetResult<Prisma.$PushSubscriptionPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of PushSubscriptions.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PushSubscriptionCountArgs} args - Arguments to filter PushSubscriptions to count.
     * @example
     * // Count the number of PushSubscriptions
     * const count = await prisma.pushSubscription.count({
     *   where: {
     *     // ... the filter for the PushSubscriptions we want to count
     *   }
     * })
    **/
    count<T extends PushSubscriptionCountArgs>(
      args?: Subset<T, PushSubscriptionCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], PushSubscriptionCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a PushSubscription.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PushSubscriptionAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends PushSubscriptionAggregateArgs>(args: Subset<T, PushSubscriptionAggregateArgs>): Prisma.PrismaPromise<GetPushSubscriptionAggregateType<T>>

    /**
     * Group by PushSubscription.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {PushSubscriptionGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends PushSubscriptionGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: PushSubscriptionGroupByArgs['orderBy'] }
        : { orderBy?: PushSubscriptionGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, PushSubscriptionGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetPushSubscriptionGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the PushSubscription model
   */
  readonly fields: PushSubscriptionFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for PushSubscription.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__PushSubscriptionClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the PushSubscription model
   */
  interface PushSubscriptionFieldRefs {
    readonly id: FieldRef<"PushSubscription", 'String'>
    readonly walletAddress: FieldRef<"PushSubscription", 'String'>
    readonly platform: FieldRef<"PushSubscription", 'String'>
    readonly token: FieldRef<"PushSubscription", 'String'>
    readonly isActive: FieldRef<"PushSubscription", 'Boolean'>
    readonly createdAt: FieldRef<"PushSubscription", 'DateTime'>
    readonly updatedAt: FieldRef<"PushSubscription", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * PushSubscription findUnique
   */
  export type PushSubscriptionFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushSubscription
     */
    select?: PushSubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PushSubscription
     */
    omit?: PushSubscriptionOmit<ExtArgs> | null
    /**
     * Filter, which PushSubscription to fetch.
     */
    where: PushSubscriptionWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PushSubscription findUniqueOrThrow
   */
  export type PushSubscriptionFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushSubscription
     */
    select?: PushSubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PushSubscription
     */
    omit?: PushSubscriptionOmit<ExtArgs> | null
    /**
     * Filter, which PushSubscription to fetch.
     */
    where: PushSubscriptionWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PushSubscription findFirst
   */
  export type PushSubscriptionFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushSubscription
     */
    select?: PushSubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PushSubscription
     */
    omit?: PushSubscriptionOmit<ExtArgs> | null
    /**
     * Filter, which PushSubscription to fetch.
     */
    where?: PushSubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PushSubscriptions to fetch.
     */
    orderBy?: PushSubscriptionOrderByWithRelationInput | PushSubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PushSubscriptions.
     */
    cursor?: PushSubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PushSubscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PushSubscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PushSubscriptions.
     */
    distinct?: PushSubscriptionScalarFieldEnum | PushSubscriptionScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PushSubscription findFirstOrThrow
   */
  export type PushSubscriptionFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushSubscription
     */
    select?: PushSubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PushSubscription
     */
    omit?: PushSubscriptionOmit<ExtArgs> | null
    /**
     * Filter, which PushSubscription to fetch.
     */
    where?: PushSubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PushSubscriptions to fetch.
     */
    orderBy?: PushSubscriptionOrderByWithRelationInput | PushSubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for PushSubscriptions.
     */
    cursor?: PushSubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PushSubscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PushSubscriptions.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of PushSubscriptions.
     */
    distinct?: PushSubscriptionScalarFieldEnum | PushSubscriptionScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PushSubscription findMany
   */
  export type PushSubscriptionFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushSubscription
     */
    select?: PushSubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PushSubscription
     */
    omit?: PushSubscriptionOmit<ExtArgs> | null
    /**
     * Filter, which PushSubscriptions to fetch.
     */
    where?: PushSubscriptionWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of PushSubscriptions to fetch.
     */
    orderBy?: PushSubscriptionOrderByWithRelationInput | PushSubscriptionOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing PushSubscriptions.
     */
    cursor?: PushSubscriptionWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` PushSubscriptions from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` PushSubscriptions.
     */
    skip?: number
    distinct?: PushSubscriptionScalarFieldEnum | PushSubscriptionScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PushSubscription create
   */
  export type PushSubscriptionCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushSubscription
     */
    select?: PushSubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PushSubscription
     */
    omit?: PushSubscriptionOmit<ExtArgs> | null
    /**
     * The data needed to create a PushSubscription.
     */
    data: XOR<PushSubscriptionCreateInput, PushSubscriptionUncheckedCreateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PushSubscription createMany
   */
  export type PushSubscriptionCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many PushSubscriptions.
     */
    data: PushSubscriptionCreateManyInput | PushSubscriptionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PushSubscription createManyAndReturn
   */
  export type PushSubscriptionCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushSubscription
     */
    select?: PushSubscriptionSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PushSubscription
     */
    omit?: PushSubscriptionOmit<ExtArgs> | null
    /**
     * The data used to create many PushSubscriptions.
     */
    data: PushSubscriptionCreateManyInput | PushSubscriptionCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * PushSubscription update
   */
  export type PushSubscriptionUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushSubscription
     */
    select?: PushSubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PushSubscription
     */
    omit?: PushSubscriptionOmit<ExtArgs> | null
    /**
     * The data needed to update a PushSubscription.
     */
    data: XOR<PushSubscriptionUpdateInput, PushSubscriptionUncheckedUpdateInput>
    /**
     * Choose, which PushSubscription to update.
     */
    where: PushSubscriptionWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PushSubscription updateMany
   */
  export type PushSubscriptionUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update PushSubscriptions.
     */
    data: XOR<PushSubscriptionUpdateManyMutationInput, PushSubscriptionUncheckedUpdateManyInput>
    /**
     * Filter which PushSubscriptions to update
     */
    where?: PushSubscriptionWhereInput
    /**
     * Limit how many PushSubscriptions to update.
     */
    limit?: number
  }

  /**
   * PushSubscription updateManyAndReturn
   */
  export type PushSubscriptionUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushSubscription
     */
    select?: PushSubscriptionSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the PushSubscription
     */
    omit?: PushSubscriptionOmit<ExtArgs> | null
    /**
     * The data used to update PushSubscriptions.
     */
    data: XOR<PushSubscriptionUpdateManyMutationInput, PushSubscriptionUncheckedUpdateManyInput>
    /**
     * Filter which PushSubscriptions to update
     */
    where?: PushSubscriptionWhereInput
    /**
     * Limit how many PushSubscriptions to update.
     */
    limit?: number
  }

  /**
   * PushSubscription upsert
   */
  export type PushSubscriptionUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushSubscription
     */
    select?: PushSubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PushSubscription
     */
    omit?: PushSubscriptionOmit<ExtArgs> | null
    /**
     * The filter to search for the PushSubscription to update in case it exists.
     */
    where: PushSubscriptionWhereUniqueInput
    /**
     * In case the PushSubscription found by the `where` argument doesn't exist, create a new PushSubscription with this data.
     */
    create: XOR<PushSubscriptionCreateInput, PushSubscriptionUncheckedCreateInput>
    /**
     * In case the PushSubscription was found with the provided `where` argument, update it with this data.
     */
    update: XOR<PushSubscriptionUpdateInput, PushSubscriptionUncheckedUpdateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PushSubscription delete
   */
  export type PushSubscriptionDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushSubscription
     */
    select?: PushSubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PushSubscription
     */
    omit?: PushSubscriptionOmit<ExtArgs> | null
    /**
     * Filter which PushSubscription to delete.
     */
    where: PushSubscriptionWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * PushSubscription deleteMany
   */
  export type PushSubscriptionDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which PushSubscriptions to delete
     */
    where?: PushSubscriptionWhereInput
    /**
     * Limit how many PushSubscriptions to delete.
     */
    limit?: number
  }

  /**
   * PushSubscription without action
   */
  export type PushSubscriptionDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the PushSubscription
     */
    select?: PushSubscriptionSelect<ExtArgs> | null
    /**
     * Omit specific fields from the PushSubscription
     */
    omit?: PushSubscriptionOmit<ExtArgs> | null
  }


  /**
   * Model Deposit
   */

  export type AggregateDeposit = {
    _count: DepositCountAggregateOutputType | null
    _avg: DepositAvgAggregateOutputType | null
    _sum: DepositSumAggregateOutputType | null
    _min: DepositMinAggregateOutputType | null
    _max: DepositMaxAggregateOutputType | null
  }

  export type DepositAvgAggregateOutputType = {
    amountSol: Decimal | null
  }

  export type DepositSumAggregateOutputType = {
    amountSol: Decimal | null
  }

  export type DepositMinAggregateOutputType = {
    id: string | null
    walletAddress: string | null
    txSignature: string | null
    amountSol: Decimal | null
    status: string | null
    createdAt: Date | null
  }

  export type DepositMaxAggregateOutputType = {
    id: string | null
    walletAddress: string | null
    txSignature: string | null
    amountSol: Decimal | null
    status: string | null
    createdAt: Date | null
  }

  export type DepositCountAggregateOutputType = {
    id: number
    walletAddress: number
    txSignature: number
    amountSol: number
    status: number
    createdAt: number
    _all: number
  }


  export type DepositAvgAggregateInputType = {
    amountSol?: true
  }

  export type DepositSumAggregateInputType = {
    amountSol?: true
  }

  export type DepositMinAggregateInputType = {
    id?: true
    walletAddress?: true
    txSignature?: true
    amountSol?: true
    status?: true
    createdAt?: true
  }

  export type DepositMaxAggregateInputType = {
    id?: true
    walletAddress?: true
    txSignature?: true
    amountSol?: true
    status?: true
    createdAt?: true
  }

  export type DepositCountAggregateInputType = {
    id?: true
    walletAddress?: true
    txSignature?: true
    amountSol?: true
    status?: true
    createdAt?: true
    _all?: true
  }

  export type DepositAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Deposit to aggregate.
     */
    where?: DepositWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Deposits to fetch.
     */
    orderBy?: DepositOrderByWithRelationInput | DepositOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DepositWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Deposits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Deposits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Deposits
    **/
    _count?: true | DepositCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: DepositAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: DepositSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DepositMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DepositMaxAggregateInputType
  }

  export type GetDepositAggregateType<T extends DepositAggregateArgs> = {
        [P in keyof T & keyof AggregateDeposit]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDeposit[P]>
      : GetScalarType<T[P], AggregateDeposit[P]>
  }




  export type DepositGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DepositWhereInput
    orderBy?: DepositOrderByWithAggregationInput | DepositOrderByWithAggregationInput[]
    by: DepositScalarFieldEnum[] | DepositScalarFieldEnum
    having?: DepositScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DepositCountAggregateInputType | true
    _avg?: DepositAvgAggregateInputType
    _sum?: DepositSumAggregateInputType
    _min?: DepositMinAggregateInputType
    _max?: DepositMaxAggregateInputType
  }

  export type DepositGroupByOutputType = {
    id: string
    walletAddress: string
    txSignature: string
    amountSol: Decimal
    status: string
    createdAt: Date
    _count: DepositCountAggregateOutputType | null
    _avg: DepositAvgAggregateOutputType | null
    _sum: DepositSumAggregateOutputType | null
    _min: DepositMinAggregateOutputType | null
    _max: DepositMaxAggregateOutputType | null
  }

  type GetDepositGroupByPayload<T extends DepositGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DepositGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DepositGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DepositGroupByOutputType[P]>
            : GetScalarType<T[P], DepositGroupByOutputType[P]>
        }
      >
    >


  export type DepositSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    txSignature?: boolean
    amountSol?: boolean
    status?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["deposit"]>

  export type DepositSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    txSignature?: boolean
    amountSol?: boolean
    status?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["deposit"]>

  export type DepositSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    txSignature?: boolean
    amountSol?: boolean
    status?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["deposit"]>

  export type DepositSelectScalar = {
    id?: boolean
    walletAddress?: boolean
    txSignature?: boolean
    amountSol?: boolean
    status?: boolean
    createdAt?: boolean
  }

  export type DepositOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "walletAddress" | "txSignature" | "amountSol" | "status" | "createdAt", ExtArgs["result"]["deposit"]>

  export type $DepositPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Deposit"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      walletAddress: string
      txSignature: string
      amountSol: Prisma.Decimal
      status: string
      createdAt: Date
    }, ExtArgs["result"]["deposit"]>
    composites: {}
  }

  type DepositGetPayload<S extends boolean | null | undefined | DepositDefaultArgs> = $Result.GetResult<Prisma.$DepositPayload, S>

  type DepositCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DepositFindManyArgs, 'select' | 'include' | 'distinct' | 'omit' | 'relationLoadStrategy'> & {
      select?: DepositCountAggregateInputType | true
    }

  export interface DepositDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Deposit'], meta: { name: 'Deposit' } }
    /**
     * Find zero or one Deposit that matches the filter.
     * @param {DepositFindUniqueArgs} args - Arguments to find a Deposit
     * @example
     * // Get one Deposit
     * const deposit = await prisma.deposit.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DepositFindUniqueArgs>(args: SelectSubset<T, DepositFindUniqueArgs<ExtArgs>>): Prisma__DepositClient<$Result.GetResult<Prisma.$DepositPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Deposit that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DepositFindUniqueOrThrowArgs} args - Arguments to find a Deposit
     * @example
     * // Get one Deposit
     * const deposit = await prisma.deposit.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DepositFindUniqueOrThrowArgs>(args: SelectSubset<T, DepositFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DepositClient<$Result.GetResult<Prisma.$DepositPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Deposit that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepositFindFirstArgs} args - Arguments to find a Deposit
     * @example
     * // Get one Deposit
     * const deposit = await prisma.deposit.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DepositFindFirstArgs>(args?: SelectSubset<T, DepositFindFirstArgs<ExtArgs>>): Prisma__DepositClient<$Result.GetResult<Prisma.$DepositPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Deposit that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepositFindFirstOrThrowArgs} args - Arguments to find a Deposit
     * @example
     * // Get one Deposit
     * const deposit = await prisma.deposit.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DepositFindFirstOrThrowArgs>(args?: SelectSubset<T, DepositFindFirstOrThrowArgs<ExtArgs>>): Prisma__DepositClient<$Result.GetResult<Prisma.$DepositPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Deposits that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepositFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Deposits
     * const deposits = await prisma.deposit.findMany()
     * 
     * // Get first 10 Deposits
     * const deposits = await prisma.deposit.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const depositWithIdOnly = await prisma.deposit.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends DepositFindManyArgs>(args?: SelectSubset<T, DepositFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DepositPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Deposit.
     * @param {DepositCreateArgs} args - Arguments to create a Deposit.
     * @example
     * // Create one Deposit
     * const Deposit = await prisma.deposit.create({
     *   data: {
     *     // ... data to create a Deposit
     *   }
     * })
     * 
     */
    create<T extends DepositCreateArgs>(args: SelectSubset<T, DepositCreateArgs<ExtArgs>>): Prisma__DepositClient<$Result.GetResult<Prisma.$DepositPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Deposits.
     * @param {DepositCreateManyArgs} args - Arguments to create many Deposits.
     * @example
     * // Create many Deposits
     * const deposit = await prisma.deposit.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DepositCreateManyArgs>(args?: SelectSubset<T, DepositCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Deposits and returns the data saved in the database.
     * @param {DepositCreateManyAndReturnArgs} args - Arguments to create many Deposits.
     * @example
     * // Create many Deposits
     * const deposit = await prisma.deposit.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Deposits and only return the `id`
     * const depositWithIdOnly = await prisma.deposit.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DepositCreateManyAndReturnArgs>(args?: SelectSubset<T, DepositCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DepositPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Deposit.
     * @param {DepositDeleteArgs} args - Arguments to delete one Deposit.
     * @example
     * // Delete one Deposit
     * const Deposit = await prisma.deposit.delete({
     *   where: {
     *     // ... filter to delete one Deposit
     *   }
     * })
     * 
     */
    delete<T extends DepositDeleteArgs>(args: SelectSubset<T, DepositDeleteArgs<ExtArgs>>): Prisma__DepositClient<$Result.GetResult<Prisma.$DepositPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Deposit.
     * @param {DepositUpdateArgs} args - Arguments to update one Deposit.
     * @example
     * // Update one Deposit
     * const deposit = await prisma.deposit.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DepositUpdateArgs>(args: SelectSubset<T, DepositUpdateArgs<ExtArgs>>): Prisma__DepositClient<$Result.GetResult<Prisma.$DepositPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Deposits.
     * @param {DepositDeleteManyArgs} args - Arguments to filter Deposits to delete.
     * @example
     * // Delete a few Deposits
     * const { count } = await prisma.deposit.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DepositDeleteManyArgs>(args?: SelectSubset<T, DepositDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Deposits.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepositUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Deposits
     * const deposit = await prisma.deposit.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DepositUpdateManyArgs>(args: SelectSubset<T, DepositUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Deposits and returns the data updated in the database.
     * @param {DepositUpdateManyAndReturnArgs} args - Arguments to update many Deposits.
     * @example
     * // Update many Deposits
     * const deposit = await prisma.deposit.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Deposits and only return the `id`
     * const depositWithIdOnly = await prisma.deposit.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DepositUpdateManyAndReturnArgs>(args: SelectSubset<T, DepositUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DepositPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Deposit.
     * @param {DepositUpsertArgs} args - Arguments to update or create a Deposit.
     * @example
     * // Update or create a Deposit
     * const deposit = await prisma.deposit.upsert({
     *   create: {
     *     // ... data to create a Deposit
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Deposit we want to update
     *   }
     * })
     */
    upsert<T extends DepositUpsertArgs>(args: SelectSubset<T, DepositUpsertArgs<ExtArgs>>): Prisma__DepositClient<$Result.GetResult<Prisma.$DepositPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Deposits.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepositCountArgs} args - Arguments to filter Deposits to count.
     * @example
     * // Count the number of Deposits
     * const count = await prisma.deposit.count({
     *   where: {
     *     // ... the filter for the Deposits we want to count
     *   }
     * })
    **/
    count<T extends DepositCountArgs>(
      args?: Subset<T, DepositCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DepositCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Deposit.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepositAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DepositAggregateArgs>(args: Subset<T, DepositAggregateArgs>): Prisma.PrismaPromise<GetDepositAggregateType<T>>

    /**
     * Group by Deposit.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepositGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DepositGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DepositGroupByArgs['orderBy'] }
        : { orderBy?: DepositGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DepositGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDepositGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Deposit model
   */
  readonly fields: DepositFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Deposit.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DepositClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Deposit model
   */
  interface DepositFieldRefs {
    readonly id: FieldRef<"Deposit", 'String'>
    readonly walletAddress: FieldRef<"Deposit", 'String'>
    readonly txSignature: FieldRef<"Deposit", 'String'>
    readonly amountSol: FieldRef<"Deposit", 'Decimal'>
    readonly status: FieldRef<"Deposit", 'String'>
    readonly createdAt: FieldRef<"Deposit", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Deposit findUnique
   */
  export type DepositFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deposit
     */
    select?: DepositSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deposit
     */
    omit?: DepositOmit<ExtArgs> | null
    /**
     * Filter, which Deposit to fetch.
     */
    where: DepositWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Deposit findUniqueOrThrow
   */
  export type DepositFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deposit
     */
    select?: DepositSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deposit
     */
    omit?: DepositOmit<ExtArgs> | null
    /**
     * Filter, which Deposit to fetch.
     */
    where: DepositWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Deposit findFirst
   */
  export type DepositFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deposit
     */
    select?: DepositSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deposit
     */
    omit?: DepositOmit<ExtArgs> | null
    /**
     * Filter, which Deposit to fetch.
     */
    where?: DepositWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Deposits to fetch.
     */
    orderBy?: DepositOrderByWithRelationInput | DepositOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Deposits.
     */
    cursor?: DepositWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Deposits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Deposits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Deposits.
     */
    distinct?: DepositScalarFieldEnum | DepositScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Deposit findFirstOrThrow
   */
  export type DepositFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deposit
     */
    select?: DepositSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deposit
     */
    omit?: DepositOmit<ExtArgs> | null
    /**
     * Filter, which Deposit to fetch.
     */
    where?: DepositWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Deposits to fetch.
     */
    orderBy?: DepositOrderByWithRelationInput | DepositOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Deposits.
     */
    cursor?: DepositWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Deposits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Deposits.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Deposits.
     */
    distinct?: DepositScalarFieldEnum | DepositScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Deposit findMany
   */
  export type DepositFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deposit
     */
    select?: DepositSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deposit
     */
    omit?: DepositOmit<ExtArgs> | null
    /**
     * Filter, which Deposits to fetch.
     */
    where?: DepositWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Deposits to fetch.
     */
    orderBy?: DepositOrderByWithRelationInput | DepositOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Deposits.
     */
    cursor?: DepositWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Deposits from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Deposits.
     */
    skip?: number
    distinct?: DepositScalarFieldEnum | DepositScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Deposit create
   */
  export type DepositCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deposit
     */
    select?: DepositSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deposit
     */
    omit?: DepositOmit<ExtArgs> | null
    /**
     * The data needed to create a Deposit.
     */
    data: XOR<DepositCreateInput, DepositUncheckedCreateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Deposit createMany
   */
  export type DepositCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Deposits.
     */
    data: DepositCreateManyInput | DepositCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Deposit createManyAndReturn
   */
  export type DepositCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deposit
     */
    select?: DepositSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Deposit
     */
    omit?: DepositOmit<ExtArgs> | null
    /**
     * The data used to create many Deposits.
     */
    data: DepositCreateManyInput | DepositCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Deposit update
   */
  export type DepositUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deposit
     */
    select?: DepositSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deposit
     */
    omit?: DepositOmit<ExtArgs> | null
    /**
     * The data needed to update a Deposit.
     */
    data: XOR<DepositUpdateInput, DepositUncheckedUpdateInput>
    /**
     * Choose, which Deposit to update.
     */
    where: DepositWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Deposit updateMany
   */
  export type DepositUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Deposits.
     */
    data: XOR<DepositUpdateManyMutationInput, DepositUncheckedUpdateManyInput>
    /**
     * Filter which Deposits to update
     */
    where?: DepositWhereInput
    /**
     * Limit how many Deposits to update.
     */
    limit?: number
  }

  /**
   * Deposit updateManyAndReturn
   */
  export type DepositUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deposit
     */
    select?: DepositSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Deposit
     */
    omit?: DepositOmit<ExtArgs> | null
    /**
     * The data used to update Deposits.
     */
    data: XOR<DepositUpdateManyMutationInput, DepositUncheckedUpdateManyInput>
    /**
     * Filter which Deposits to update
     */
    where?: DepositWhereInput
    /**
     * Limit how many Deposits to update.
     */
    limit?: number
  }

  /**
   * Deposit upsert
   */
  export type DepositUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deposit
     */
    select?: DepositSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deposit
     */
    omit?: DepositOmit<ExtArgs> | null
    /**
     * The filter to search for the Deposit to update in case it exists.
     */
    where: DepositWhereUniqueInput
    /**
     * In case the Deposit found by the `where` argument doesn't exist, create a new Deposit with this data.
     */
    create: XOR<DepositCreateInput, DepositUncheckedCreateInput>
    /**
     * In case the Deposit was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DepositUpdateInput, DepositUncheckedUpdateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Deposit delete
   */
  export type DepositDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deposit
     */
    select?: DepositSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deposit
     */
    omit?: DepositOmit<ExtArgs> | null
    /**
     * Filter which Deposit to delete.
     */
    where: DepositWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Deposit deleteMany
   */
  export type DepositDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Deposits to delete
     */
    where?: DepositWhereInput
    /**
     * Limit how many Deposits to delete.
     */
    limit?: number
  }

  /**
   * Deposit without action
   */
  export type DepositDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Deposit
     */
    select?: DepositSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Deposit
     */
    omit?: DepositOmit<ExtArgs> | null
  }


  /**
   * Model DepositScan
   */

  export type AggregateDepositScan = {
    _count: DepositScanCountAggregateOutputType | null
    _min: DepositScanMinAggregateOutputType | null
    _max: DepositScanMaxAggregateOutputType | null
  }

  export type DepositScanMinAggregateOutputType = {
    walletAddress: string | null
    lastSignature: string | null
    updatedAt: Date | null
  }

  export type DepositScanMaxAggregateOutputType = {
    walletAddress: string | null
    lastSignature: string | null
    updatedAt: Date | null
  }

  export type DepositScanCountAggregateOutputType = {
    walletAddress: number
    lastSignature: number
    updatedAt: number
    _all: number
  }


  export type DepositScanMinAggregateInputType = {
    walletAddress?: true
    lastSignature?: true
    updatedAt?: true
  }

  export type DepositScanMaxAggregateInputType = {
    walletAddress?: true
    lastSignature?: true
    updatedAt?: true
  }

  export type DepositScanCountAggregateInputType = {
    walletAddress?: true
    lastSignature?: true
    updatedAt?: true
    _all?: true
  }

  export type DepositScanAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DepositScan to aggregate.
     */
    where?: DepositScanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DepositScans to fetch.
     */
    orderBy?: DepositScanOrderByWithRelationInput | DepositScanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: DepositScanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DepositScans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DepositScans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned DepositScans
    **/
    _count?: true | DepositScanCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: DepositScanMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: DepositScanMaxAggregateInputType
  }

  export type GetDepositScanAggregateType<T extends DepositScanAggregateArgs> = {
        [P in keyof T & keyof AggregateDepositScan]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateDepositScan[P]>
      : GetScalarType<T[P], AggregateDepositScan[P]>
  }




  export type DepositScanGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: DepositScanWhereInput
    orderBy?: DepositScanOrderByWithAggregationInput | DepositScanOrderByWithAggregationInput[]
    by: DepositScanScalarFieldEnum[] | DepositScanScalarFieldEnum
    having?: DepositScanScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: DepositScanCountAggregateInputType | true
    _min?: DepositScanMinAggregateInputType
    _max?: DepositScanMaxAggregateInputType
  }

  export type DepositScanGroupByOutputType = {
    walletAddress: string
    lastSignature: string | null
    updatedAt: Date
    _count: DepositScanCountAggregateOutputType | null
    _min: DepositScanMinAggregateOutputType | null
    _max: DepositScanMaxAggregateOutputType | null
  }

  type GetDepositScanGroupByPayload<T extends DepositScanGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<DepositScanGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof DepositScanGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], DepositScanGroupByOutputType[P]>
            : GetScalarType<T[P], DepositScanGroupByOutputType[P]>
        }
      >
    >


  export type DepositScanSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    walletAddress?: boolean
    lastSignature?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["depositScan"]>

  export type DepositScanSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    walletAddress?: boolean
    lastSignature?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["depositScan"]>

  export type DepositScanSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    walletAddress?: boolean
    lastSignature?: boolean
    updatedAt?: boolean
  }, ExtArgs["result"]["depositScan"]>

  export type DepositScanSelectScalar = {
    walletAddress?: boolean
    lastSignature?: boolean
    updatedAt?: boolean
  }

  export type DepositScanOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"walletAddress" | "lastSignature" | "updatedAt", ExtArgs["result"]["depositScan"]>

  export type $DepositScanPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "DepositScan"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      walletAddress: string
      lastSignature: string | null
      updatedAt: Date
    }, ExtArgs["result"]["depositScan"]>
    composites: {}
  }

  type DepositScanGetPayload<S extends boolean | null | undefined | DepositScanDefaultArgs> = $Result.GetResult<Prisma.$DepositScanPayload, S>

  type DepositScanCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<DepositScanFindManyArgs, 'select' | 'include' | 'distinct' | 'omit' | 'relationLoadStrategy'> & {
      select?: DepositScanCountAggregateInputType | true
    }

  export interface DepositScanDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['DepositScan'], meta: { name: 'DepositScan' } }
    /**
     * Find zero or one DepositScan that matches the filter.
     * @param {DepositScanFindUniqueArgs} args - Arguments to find a DepositScan
     * @example
     * // Get one DepositScan
     * const depositScan = await prisma.depositScan.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends DepositScanFindUniqueArgs>(args: SelectSubset<T, DepositScanFindUniqueArgs<ExtArgs>>): Prisma__DepositScanClient<$Result.GetResult<Prisma.$DepositScanPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one DepositScan that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {DepositScanFindUniqueOrThrowArgs} args - Arguments to find a DepositScan
     * @example
     * // Get one DepositScan
     * const depositScan = await prisma.depositScan.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends DepositScanFindUniqueOrThrowArgs>(args: SelectSubset<T, DepositScanFindUniqueOrThrowArgs<ExtArgs>>): Prisma__DepositScanClient<$Result.GetResult<Prisma.$DepositScanPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DepositScan that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepositScanFindFirstArgs} args - Arguments to find a DepositScan
     * @example
     * // Get one DepositScan
     * const depositScan = await prisma.depositScan.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends DepositScanFindFirstArgs>(args?: SelectSubset<T, DepositScanFindFirstArgs<ExtArgs>>): Prisma__DepositScanClient<$Result.GetResult<Prisma.$DepositScanPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first DepositScan that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepositScanFindFirstOrThrowArgs} args - Arguments to find a DepositScan
     * @example
     * // Get one DepositScan
     * const depositScan = await prisma.depositScan.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends DepositScanFindFirstOrThrowArgs>(args?: SelectSubset<T, DepositScanFindFirstOrThrowArgs<ExtArgs>>): Prisma__DepositScanClient<$Result.GetResult<Prisma.$DepositScanPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more DepositScans that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepositScanFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all DepositScans
     * const depositScans = await prisma.depositScan.findMany()
     * 
     * // Get first 10 DepositScans
     * const depositScans = await prisma.depositScan.findMany({ take: 10 })
     * 
     * // Only select the `walletAddress`
     * const depositScanWithWalletAddressOnly = await prisma.depositScan.findMany({ select: { walletAddress: true } })
     * 
     */
    findMany<T extends DepositScanFindManyArgs>(args?: SelectSubset<T, DepositScanFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DepositScanPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a DepositScan.
     * @param {DepositScanCreateArgs} args - Arguments to create a DepositScan.
     * @example
     * // Create one DepositScan
     * const DepositScan = await prisma.depositScan.create({
     *   data: {
     *     // ... data to create a DepositScan
     *   }
     * })
     * 
     */
    create<T extends DepositScanCreateArgs>(args: SelectSubset<T, DepositScanCreateArgs<ExtArgs>>): Prisma__DepositScanClient<$Result.GetResult<Prisma.$DepositScanPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many DepositScans.
     * @param {DepositScanCreateManyArgs} args - Arguments to create many DepositScans.
     * @example
     * // Create many DepositScans
     * const depositScan = await prisma.depositScan.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends DepositScanCreateManyArgs>(args?: SelectSubset<T, DepositScanCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many DepositScans and returns the data saved in the database.
     * @param {DepositScanCreateManyAndReturnArgs} args - Arguments to create many DepositScans.
     * @example
     * // Create many DepositScans
     * const depositScan = await prisma.depositScan.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many DepositScans and only return the `walletAddress`
     * const depositScanWithWalletAddressOnly = await prisma.depositScan.createManyAndReturn({
     *   select: { walletAddress: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends DepositScanCreateManyAndReturnArgs>(args?: SelectSubset<T, DepositScanCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DepositScanPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a DepositScan.
     * @param {DepositScanDeleteArgs} args - Arguments to delete one DepositScan.
     * @example
     * // Delete one DepositScan
     * const DepositScan = await prisma.depositScan.delete({
     *   where: {
     *     // ... filter to delete one DepositScan
     *   }
     * })
     * 
     */
    delete<T extends DepositScanDeleteArgs>(args: SelectSubset<T, DepositScanDeleteArgs<ExtArgs>>): Prisma__DepositScanClient<$Result.GetResult<Prisma.$DepositScanPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one DepositScan.
     * @param {DepositScanUpdateArgs} args - Arguments to update one DepositScan.
     * @example
     * // Update one DepositScan
     * const depositScan = await prisma.depositScan.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends DepositScanUpdateArgs>(args: SelectSubset<T, DepositScanUpdateArgs<ExtArgs>>): Prisma__DepositScanClient<$Result.GetResult<Prisma.$DepositScanPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more DepositScans.
     * @param {DepositScanDeleteManyArgs} args - Arguments to filter DepositScans to delete.
     * @example
     * // Delete a few DepositScans
     * const { count } = await prisma.depositScan.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends DepositScanDeleteManyArgs>(args?: SelectSubset<T, DepositScanDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DepositScans.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepositScanUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many DepositScans
     * const depositScan = await prisma.depositScan.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends DepositScanUpdateManyArgs>(args: SelectSubset<T, DepositScanUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more DepositScans and returns the data updated in the database.
     * @param {DepositScanUpdateManyAndReturnArgs} args - Arguments to update many DepositScans.
     * @example
     * // Update many DepositScans
     * const depositScan = await prisma.depositScan.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more DepositScans and only return the `walletAddress`
     * const depositScanWithWalletAddressOnly = await prisma.depositScan.updateManyAndReturn({
     *   select: { walletAddress: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends DepositScanUpdateManyAndReturnArgs>(args: SelectSubset<T, DepositScanUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$DepositScanPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one DepositScan.
     * @param {DepositScanUpsertArgs} args - Arguments to update or create a DepositScan.
     * @example
     * // Update or create a DepositScan
     * const depositScan = await prisma.depositScan.upsert({
     *   create: {
     *     // ... data to create a DepositScan
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the DepositScan we want to update
     *   }
     * })
     */
    upsert<T extends DepositScanUpsertArgs>(args: SelectSubset<T, DepositScanUpsertArgs<ExtArgs>>): Prisma__DepositScanClient<$Result.GetResult<Prisma.$DepositScanPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of DepositScans.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepositScanCountArgs} args - Arguments to filter DepositScans to count.
     * @example
     * // Count the number of DepositScans
     * const count = await prisma.depositScan.count({
     *   where: {
     *     // ... the filter for the DepositScans we want to count
     *   }
     * })
    **/
    count<T extends DepositScanCountArgs>(
      args?: Subset<T, DepositScanCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], DepositScanCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a DepositScan.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepositScanAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends DepositScanAggregateArgs>(args: Subset<T, DepositScanAggregateArgs>): Prisma.PrismaPromise<GetDepositScanAggregateType<T>>

    /**
     * Group by DepositScan.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {DepositScanGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends DepositScanGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: DepositScanGroupByArgs['orderBy'] }
        : { orderBy?: DepositScanGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, DepositScanGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetDepositScanGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the DepositScan model
   */
  readonly fields: DepositScanFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for DepositScan.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__DepositScanClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the DepositScan model
   */
  interface DepositScanFieldRefs {
    readonly walletAddress: FieldRef<"DepositScan", 'String'>
    readonly lastSignature: FieldRef<"DepositScan", 'String'>
    readonly updatedAt: FieldRef<"DepositScan", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * DepositScan findUnique
   */
  export type DepositScanFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DepositScan
     */
    select?: DepositScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DepositScan
     */
    omit?: DepositScanOmit<ExtArgs> | null
    /**
     * Filter, which DepositScan to fetch.
     */
    where: DepositScanWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * DepositScan findUniqueOrThrow
   */
  export type DepositScanFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DepositScan
     */
    select?: DepositScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DepositScan
     */
    omit?: DepositScanOmit<ExtArgs> | null
    /**
     * Filter, which DepositScan to fetch.
     */
    where: DepositScanWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * DepositScan findFirst
   */
  export type DepositScanFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DepositScan
     */
    select?: DepositScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DepositScan
     */
    omit?: DepositScanOmit<ExtArgs> | null
    /**
     * Filter, which DepositScan to fetch.
     */
    where?: DepositScanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DepositScans to fetch.
     */
    orderBy?: DepositScanOrderByWithRelationInput | DepositScanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DepositScans.
     */
    cursor?: DepositScanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DepositScans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DepositScans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DepositScans.
     */
    distinct?: DepositScanScalarFieldEnum | DepositScanScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * DepositScan findFirstOrThrow
   */
  export type DepositScanFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DepositScan
     */
    select?: DepositScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DepositScan
     */
    omit?: DepositScanOmit<ExtArgs> | null
    /**
     * Filter, which DepositScan to fetch.
     */
    where?: DepositScanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DepositScans to fetch.
     */
    orderBy?: DepositScanOrderByWithRelationInput | DepositScanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for DepositScans.
     */
    cursor?: DepositScanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DepositScans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DepositScans.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of DepositScans.
     */
    distinct?: DepositScanScalarFieldEnum | DepositScanScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * DepositScan findMany
   */
  export type DepositScanFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DepositScan
     */
    select?: DepositScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DepositScan
     */
    omit?: DepositScanOmit<ExtArgs> | null
    /**
     * Filter, which DepositScans to fetch.
     */
    where?: DepositScanWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of DepositScans to fetch.
     */
    orderBy?: DepositScanOrderByWithRelationInput | DepositScanOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing DepositScans.
     */
    cursor?: DepositScanWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` DepositScans from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` DepositScans.
     */
    skip?: number
    distinct?: DepositScanScalarFieldEnum | DepositScanScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * DepositScan create
   */
  export type DepositScanCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DepositScan
     */
    select?: DepositScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DepositScan
     */
    omit?: DepositScanOmit<ExtArgs> | null
    /**
     * The data needed to create a DepositScan.
     */
    data: XOR<DepositScanCreateInput, DepositScanUncheckedCreateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * DepositScan createMany
   */
  export type DepositScanCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many DepositScans.
     */
    data: DepositScanCreateManyInput | DepositScanCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * DepositScan createManyAndReturn
   */
  export type DepositScanCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DepositScan
     */
    select?: DepositScanSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DepositScan
     */
    omit?: DepositScanOmit<ExtArgs> | null
    /**
     * The data used to create many DepositScans.
     */
    data: DepositScanCreateManyInput | DepositScanCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * DepositScan update
   */
  export type DepositScanUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DepositScan
     */
    select?: DepositScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DepositScan
     */
    omit?: DepositScanOmit<ExtArgs> | null
    /**
     * The data needed to update a DepositScan.
     */
    data: XOR<DepositScanUpdateInput, DepositScanUncheckedUpdateInput>
    /**
     * Choose, which DepositScan to update.
     */
    where: DepositScanWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * DepositScan updateMany
   */
  export type DepositScanUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update DepositScans.
     */
    data: XOR<DepositScanUpdateManyMutationInput, DepositScanUncheckedUpdateManyInput>
    /**
     * Filter which DepositScans to update
     */
    where?: DepositScanWhereInput
    /**
     * Limit how many DepositScans to update.
     */
    limit?: number
  }

  /**
   * DepositScan updateManyAndReturn
   */
  export type DepositScanUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DepositScan
     */
    select?: DepositScanSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the DepositScan
     */
    omit?: DepositScanOmit<ExtArgs> | null
    /**
     * The data used to update DepositScans.
     */
    data: XOR<DepositScanUpdateManyMutationInput, DepositScanUncheckedUpdateManyInput>
    /**
     * Filter which DepositScans to update
     */
    where?: DepositScanWhereInput
    /**
     * Limit how many DepositScans to update.
     */
    limit?: number
  }

  /**
   * DepositScan upsert
   */
  export type DepositScanUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DepositScan
     */
    select?: DepositScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DepositScan
     */
    omit?: DepositScanOmit<ExtArgs> | null
    /**
     * The filter to search for the DepositScan to update in case it exists.
     */
    where: DepositScanWhereUniqueInput
    /**
     * In case the DepositScan found by the `where` argument doesn't exist, create a new DepositScan with this data.
     */
    create: XOR<DepositScanCreateInput, DepositScanUncheckedCreateInput>
    /**
     * In case the DepositScan was found with the provided `where` argument, update it with this data.
     */
    update: XOR<DepositScanUpdateInput, DepositScanUncheckedUpdateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * DepositScan delete
   */
  export type DepositScanDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DepositScan
     */
    select?: DepositScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DepositScan
     */
    omit?: DepositScanOmit<ExtArgs> | null
    /**
     * Filter which DepositScan to delete.
     */
    where: DepositScanWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * DepositScan deleteMany
   */
  export type DepositScanDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which DepositScans to delete
     */
    where?: DepositScanWhereInput
    /**
     * Limit how many DepositScans to delete.
     */
    limit?: number
  }

  /**
   * DepositScan without action
   */
  export type DepositScanDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the DepositScan
     */
    select?: DepositScanSelect<ExtArgs> | null
    /**
     * Omit specific fields from the DepositScan
     */
    omit?: DepositScanOmit<ExtArgs> | null
  }


  /**
   * Model Withdrawal
   */

  export type AggregateWithdrawal = {
    _count: WithdrawalCountAggregateOutputType | null
    _avg: WithdrawalAvgAggregateOutputType | null
    _sum: WithdrawalSumAggregateOutputType | null
    _min: WithdrawalMinAggregateOutputType | null
    _max: WithdrawalMaxAggregateOutputType | null
  }

  export type WithdrawalAvgAggregateOutputType = {
    amountSol: Decimal | null
  }

  export type WithdrawalSumAggregateOutputType = {
    amountSol: Decimal | null
  }

  export type WithdrawalMinAggregateOutputType = {
    id: string | null
    walletAddress: string | null
    destination: string | null
    amountSol: Decimal | null
    txSignature: string | null
    status: string | null
    idempotencyKey: string | null
    createdAt: Date | null
  }

  export type WithdrawalMaxAggregateOutputType = {
    id: string | null
    walletAddress: string | null
    destination: string | null
    amountSol: Decimal | null
    txSignature: string | null
    status: string | null
    idempotencyKey: string | null
    createdAt: Date | null
  }

  export type WithdrawalCountAggregateOutputType = {
    id: number
    walletAddress: number
    destination: number
    amountSol: number
    txSignature: number
    status: number
    idempotencyKey: number
    createdAt: number
    _all: number
  }


  export type WithdrawalAvgAggregateInputType = {
    amountSol?: true
  }

  export type WithdrawalSumAggregateInputType = {
    amountSol?: true
  }

  export type WithdrawalMinAggregateInputType = {
    id?: true
    walletAddress?: true
    destination?: true
    amountSol?: true
    txSignature?: true
    status?: true
    idempotencyKey?: true
    createdAt?: true
  }

  export type WithdrawalMaxAggregateInputType = {
    id?: true
    walletAddress?: true
    destination?: true
    amountSol?: true
    txSignature?: true
    status?: true
    idempotencyKey?: true
    createdAt?: true
  }

  export type WithdrawalCountAggregateInputType = {
    id?: true
    walletAddress?: true
    destination?: true
    amountSol?: true
    txSignature?: true
    status?: true
    idempotencyKey?: true
    createdAt?: true
    _all?: true
  }

  export type WithdrawalAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Withdrawal to aggregate.
     */
    where?: WithdrawalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Withdrawals to fetch.
     */
    orderBy?: WithdrawalOrderByWithRelationInput | WithdrawalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: WithdrawalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Withdrawals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Withdrawals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Withdrawals
    **/
    _count?: true | WithdrawalCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: WithdrawalAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: WithdrawalSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: WithdrawalMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: WithdrawalMaxAggregateInputType
  }

  export type GetWithdrawalAggregateType<T extends WithdrawalAggregateArgs> = {
        [P in keyof T & keyof AggregateWithdrawal]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateWithdrawal[P]>
      : GetScalarType<T[P], AggregateWithdrawal[P]>
  }




  export type WithdrawalGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: WithdrawalWhereInput
    orderBy?: WithdrawalOrderByWithAggregationInput | WithdrawalOrderByWithAggregationInput[]
    by: WithdrawalScalarFieldEnum[] | WithdrawalScalarFieldEnum
    having?: WithdrawalScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: WithdrawalCountAggregateInputType | true
    _avg?: WithdrawalAvgAggregateInputType
    _sum?: WithdrawalSumAggregateInputType
    _min?: WithdrawalMinAggregateInputType
    _max?: WithdrawalMaxAggregateInputType
  }

  export type WithdrawalGroupByOutputType = {
    id: string
    walletAddress: string
    destination: string
    amountSol: Decimal
    txSignature: string | null
    status: string
    idempotencyKey: string | null
    createdAt: Date
    _count: WithdrawalCountAggregateOutputType | null
    _avg: WithdrawalAvgAggregateOutputType | null
    _sum: WithdrawalSumAggregateOutputType | null
    _min: WithdrawalMinAggregateOutputType | null
    _max: WithdrawalMaxAggregateOutputType | null
  }

  type GetWithdrawalGroupByPayload<T extends WithdrawalGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<WithdrawalGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof WithdrawalGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], WithdrawalGroupByOutputType[P]>
            : GetScalarType<T[P], WithdrawalGroupByOutputType[P]>
        }
      >
    >


  export type WithdrawalSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    destination?: boolean
    amountSol?: boolean
    txSignature?: boolean
    status?: boolean
    idempotencyKey?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["withdrawal"]>

  export type WithdrawalSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    destination?: boolean
    amountSol?: boolean
    txSignature?: boolean
    status?: boolean
    idempotencyKey?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["withdrawal"]>

  export type WithdrawalSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    walletAddress?: boolean
    destination?: boolean
    amountSol?: boolean
    txSignature?: boolean
    status?: boolean
    idempotencyKey?: boolean
    createdAt?: boolean
  }, ExtArgs["result"]["withdrawal"]>

  export type WithdrawalSelectScalar = {
    id?: boolean
    walletAddress?: boolean
    destination?: boolean
    amountSol?: boolean
    txSignature?: boolean
    status?: boolean
    idempotencyKey?: boolean
    createdAt?: boolean
  }

  export type WithdrawalOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "walletAddress" | "destination" | "amountSol" | "txSignature" | "status" | "idempotencyKey" | "createdAt", ExtArgs["result"]["withdrawal"]>

  export type $WithdrawalPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Withdrawal"
    objects: {}
    scalars: $Extensions.GetPayloadResult<{
      id: string
      walletAddress: string
      destination: string
      amountSol: Prisma.Decimal
      txSignature: string | null
      status: string
      idempotencyKey: string | null
      createdAt: Date
    }, ExtArgs["result"]["withdrawal"]>
    composites: {}
  }

  type WithdrawalGetPayload<S extends boolean | null | undefined | WithdrawalDefaultArgs> = $Result.GetResult<Prisma.$WithdrawalPayload, S>

  type WithdrawalCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<WithdrawalFindManyArgs, 'select' | 'include' | 'distinct' | 'omit' | 'relationLoadStrategy'> & {
      select?: WithdrawalCountAggregateInputType | true
    }

  export interface WithdrawalDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Withdrawal'], meta: { name: 'Withdrawal' } }
    /**
     * Find zero or one Withdrawal that matches the filter.
     * @param {WithdrawalFindUniqueArgs} args - Arguments to find a Withdrawal
     * @example
     * // Get one Withdrawal
     * const withdrawal = await prisma.withdrawal.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends WithdrawalFindUniqueArgs>(args: SelectSubset<T, WithdrawalFindUniqueArgs<ExtArgs>>): Prisma__WithdrawalClient<$Result.GetResult<Prisma.$WithdrawalPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Withdrawal that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {WithdrawalFindUniqueOrThrowArgs} args - Arguments to find a Withdrawal
     * @example
     * // Get one Withdrawal
     * const withdrawal = await prisma.withdrawal.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends WithdrawalFindUniqueOrThrowArgs>(args: SelectSubset<T, WithdrawalFindUniqueOrThrowArgs<ExtArgs>>): Prisma__WithdrawalClient<$Result.GetResult<Prisma.$WithdrawalPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Withdrawal that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WithdrawalFindFirstArgs} args - Arguments to find a Withdrawal
     * @example
     * // Get one Withdrawal
     * const withdrawal = await prisma.withdrawal.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends WithdrawalFindFirstArgs>(args?: SelectSubset<T, WithdrawalFindFirstArgs<ExtArgs>>): Prisma__WithdrawalClient<$Result.GetResult<Prisma.$WithdrawalPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Withdrawal that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WithdrawalFindFirstOrThrowArgs} args - Arguments to find a Withdrawal
     * @example
     * // Get one Withdrawal
     * const withdrawal = await prisma.withdrawal.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends WithdrawalFindFirstOrThrowArgs>(args?: SelectSubset<T, WithdrawalFindFirstOrThrowArgs<ExtArgs>>): Prisma__WithdrawalClient<$Result.GetResult<Prisma.$WithdrawalPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Withdrawals that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WithdrawalFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Withdrawals
     * const withdrawals = await prisma.withdrawal.findMany()
     * 
     * // Get first 10 Withdrawals
     * const withdrawals = await prisma.withdrawal.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const withdrawalWithIdOnly = await prisma.withdrawal.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends WithdrawalFindManyArgs>(args?: SelectSubset<T, WithdrawalFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WithdrawalPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Withdrawal.
     * @param {WithdrawalCreateArgs} args - Arguments to create a Withdrawal.
     * @example
     * // Create one Withdrawal
     * const Withdrawal = await prisma.withdrawal.create({
     *   data: {
     *     // ... data to create a Withdrawal
     *   }
     * })
     * 
     */
    create<T extends WithdrawalCreateArgs>(args: SelectSubset<T, WithdrawalCreateArgs<ExtArgs>>): Prisma__WithdrawalClient<$Result.GetResult<Prisma.$WithdrawalPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Withdrawals.
     * @param {WithdrawalCreateManyArgs} args - Arguments to create many Withdrawals.
     * @example
     * // Create many Withdrawals
     * const withdrawal = await prisma.withdrawal.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends WithdrawalCreateManyArgs>(args?: SelectSubset<T, WithdrawalCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Withdrawals and returns the data saved in the database.
     * @param {WithdrawalCreateManyAndReturnArgs} args - Arguments to create many Withdrawals.
     * @example
     * // Create many Withdrawals
     * const withdrawal = await prisma.withdrawal.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Withdrawals and only return the `id`
     * const withdrawalWithIdOnly = await prisma.withdrawal.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends WithdrawalCreateManyAndReturnArgs>(args?: SelectSubset<T, WithdrawalCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WithdrawalPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Withdrawal.
     * @param {WithdrawalDeleteArgs} args - Arguments to delete one Withdrawal.
     * @example
     * // Delete one Withdrawal
     * const Withdrawal = await prisma.withdrawal.delete({
     *   where: {
     *     // ... filter to delete one Withdrawal
     *   }
     * })
     * 
     */
    delete<T extends WithdrawalDeleteArgs>(args: SelectSubset<T, WithdrawalDeleteArgs<ExtArgs>>): Prisma__WithdrawalClient<$Result.GetResult<Prisma.$WithdrawalPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Withdrawal.
     * @param {WithdrawalUpdateArgs} args - Arguments to update one Withdrawal.
     * @example
     * // Update one Withdrawal
     * const withdrawal = await prisma.withdrawal.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends WithdrawalUpdateArgs>(args: SelectSubset<T, WithdrawalUpdateArgs<ExtArgs>>): Prisma__WithdrawalClient<$Result.GetResult<Prisma.$WithdrawalPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Withdrawals.
     * @param {WithdrawalDeleteManyArgs} args - Arguments to filter Withdrawals to delete.
     * @example
     * // Delete a few Withdrawals
     * const { count } = await prisma.withdrawal.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends WithdrawalDeleteManyArgs>(args?: SelectSubset<T, WithdrawalDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Withdrawals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WithdrawalUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Withdrawals
     * const withdrawal = await prisma.withdrawal.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends WithdrawalUpdateManyArgs>(args: SelectSubset<T, WithdrawalUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Withdrawals and returns the data updated in the database.
     * @param {WithdrawalUpdateManyAndReturnArgs} args - Arguments to update many Withdrawals.
     * @example
     * // Update many Withdrawals
     * const withdrawal = await prisma.withdrawal.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Withdrawals and only return the `id`
     * const withdrawalWithIdOnly = await prisma.withdrawal.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends WithdrawalUpdateManyAndReturnArgs>(args: SelectSubset<T, WithdrawalUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$WithdrawalPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Withdrawal.
     * @param {WithdrawalUpsertArgs} args - Arguments to update or create a Withdrawal.
     * @example
     * // Update or create a Withdrawal
     * const withdrawal = await prisma.withdrawal.upsert({
     *   create: {
     *     // ... data to create a Withdrawal
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Withdrawal we want to update
     *   }
     * })
     */
    upsert<T extends WithdrawalUpsertArgs>(args: SelectSubset<T, WithdrawalUpsertArgs<ExtArgs>>): Prisma__WithdrawalClient<$Result.GetResult<Prisma.$WithdrawalPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Withdrawals.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WithdrawalCountArgs} args - Arguments to filter Withdrawals to count.
     * @example
     * // Count the number of Withdrawals
     * const count = await prisma.withdrawal.count({
     *   where: {
     *     // ... the filter for the Withdrawals we want to count
     *   }
     * })
    **/
    count<T extends WithdrawalCountArgs>(
      args?: Subset<T, WithdrawalCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], WithdrawalCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Withdrawal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WithdrawalAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends WithdrawalAggregateArgs>(args: Subset<T, WithdrawalAggregateArgs>): Prisma.PrismaPromise<GetWithdrawalAggregateType<T>>

    /**
     * Group by Withdrawal.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {WithdrawalGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends WithdrawalGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: WithdrawalGroupByArgs['orderBy'] }
        : { orderBy?: WithdrawalGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, WithdrawalGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetWithdrawalGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Withdrawal model
   */
  readonly fields: WithdrawalFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Withdrawal.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__WithdrawalClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Withdrawal model
   */
  interface WithdrawalFieldRefs {
    readonly id: FieldRef<"Withdrawal", 'String'>
    readonly walletAddress: FieldRef<"Withdrawal", 'String'>
    readonly destination: FieldRef<"Withdrawal", 'String'>
    readonly amountSol: FieldRef<"Withdrawal", 'Decimal'>
    readonly txSignature: FieldRef<"Withdrawal", 'String'>
    readonly status: FieldRef<"Withdrawal", 'String'>
    readonly idempotencyKey: FieldRef<"Withdrawal", 'String'>
    readonly createdAt: FieldRef<"Withdrawal", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * Withdrawal findUnique
   */
  export type WithdrawalFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Withdrawal
     */
    select?: WithdrawalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Withdrawal
     */
    omit?: WithdrawalOmit<ExtArgs> | null
    /**
     * Filter, which Withdrawal to fetch.
     */
    where: WithdrawalWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Withdrawal findUniqueOrThrow
   */
  export type WithdrawalFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Withdrawal
     */
    select?: WithdrawalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Withdrawal
     */
    omit?: WithdrawalOmit<ExtArgs> | null
    /**
     * Filter, which Withdrawal to fetch.
     */
    where: WithdrawalWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Withdrawal findFirst
   */
  export type WithdrawalFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Withdrawal
     */
    select?: WithdrawalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Withdrawal
     */
    omit?: WithdrawalOmit<ExtArgs> | null
    /**
     * Filter, which Withdrawal to fetch.
     */
    where?: WithdrawalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Withdrawals to fetch.
     */
    orderBy?: WithdrawalOrderByWithRelationInput | WithdrawalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Withdrawals.
     */
    cursor?: WithdrawalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Withdrawals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Withdrawals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Withdrawals.
     */
    distinct?: WithdrawalScalarFieldEnum | WithdrawalScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Withdrawal findFirstOrThrow
   */
  export type WithdrawalFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Withdrawal
     */
    select?: WithdrawalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Withdrawal
     */
    omit?: WithdrawalOmit<ExtArgs> | null
    /**
     * Filter, which Withdrawal to fetch.
     */
    where?: WithdrawalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Withdrawals to fetch.
     */
    orderBy?: WithdrawalOrderByWithRelationInput | WithdrawalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Withdrawals.
     */
    cursor?: WithdrawalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Withdrawals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Withdrawals.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Withdrawals.
     */
    distinct?: WithdrawalScalarFieldEnum | WithdrawalScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Withdrawal findMany
   */
  export type WithdrawalFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Withdrawal
     */
    select?: WithdrawalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Withdrawal
     */
    omit?: WithdrawalOmit<ExtArgs> | null
    /**
     * Filter, which Withdrawals to fetch.
     */
    where?: WithdrawalWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Withdrawals to fetch.
     */
    orderBy?: WithdrawalOrderByWithRelationInput | WithdrawalOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Withdrawals.
     */
    cursor?: WithdrawalWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Withdrawals from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Withdrawals.
     */
    skip?: number
    distinct?: WithdrawalScalarFieldEnum | WithdrawalScalarFieldEnum[]
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Withdrawal create
   */
  export type WithdrawalCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Withdrawal
     */
    select?: WithdrawalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Withdrawal
     */
    omit?: WithdrawalOmit<ExtArgs> | null
    /**
     * The data needed to create a Withdrawal.
     */
    data: XOR<WithdrawalCreateInput, WithdrawalUncheckedCreateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Withdrawal createMany
   */
  export type WithdrawalCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Withdrawals.
     */
    data: WithdrawalCreateManyInput | WithdrawalCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Withdrawal createManyAndReturn
   */
  export type WithdrawalCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Withdrawal
     */
    select?: WithdrawalSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Withdrawal
     */
    omit?: WithdrawalOmit<ExtArgs> | null
    /**
     * The data used to create many Withdrawals.
     */
    data: WithdrawalCreateManyInput | WithdrawalCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * Withdrawal update
   */
  export type WithdrawalUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Withdrawal
     */
    select?: WithdrawalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Withdrawal
     */
    omit?: WithdrawalOmit<ExtArgs> | null
    /**
     * The data needed to update a Withdrawal.
     */
    data: XOR<WithdrawalUpdateInput, WithdrawalUncheckedUpdateInput>
    /**
     * Choose, which Withdrawal to update.
     */
    where: WithdrawalWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Withdrawal updateMany
   */
  export type WithdrawalUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Withdrawals.
     */
    data: XOR<WithdrawalUpdateManyMutationInput, WithdrawalUncheckedUpdateManyInput>
    /**
     * Filter which Withdrawals to update
     */
    where?: WithdrawalWhereInput
    /**
     * Limit how many Withdrawals to update.
     */
    limit?: number
  }

  /**
   * Withdrawal updateManyAndReturn
   */
  export type WithdrawalUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Withdrawal
     */
    select?: WithdrawalSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Withdrawal
     */
    omit?: WithdrawalOmit<ExtArgs> | null
    /**
     * The data used to update Withdrawals.
     */
    data: XOR<WithdrawalUpdateManyMutationInput, WithdrawalUncheckedUpdateManyInput>
    /**
     * Filter which Withdrawals to update
     */
    where?: WithdrawalWhereInput
    /**
     * Limit how many Withdrawals to update.
     */
    limit?: number
  }

  /**
   * Withdrawal upsert
   */
  export type WithdrawalUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Withdrawal
     */
    select?: WithdrawalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Withdrawal
     */
    omit?: WithdrawalOmit<ExtArgs> | null
    /**
     * The filter to search for the Withdrawal to update in case it exists.
     */
    where: WithdrawalWhereUniqueInput
    /**
     * In case the Withdrawal found by the `where` argument doesn't exist, create a new Withdrawal with this data.
     */
    create: XOR<WithdrawalCreateInput, WithdrawalUncheckedCreateInput>
    /**
     * In case the Withdrawal was found with the provided `where` argument, update it with this data.
     */
    update: XOR<WithdrawalUpdateInput, WithdrawalUncheckedUpdateInput>
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Withdrawal delete
   */
  export type WithdrawalDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Withdrawal
     */
    select?: WithdrawalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Withdrawal
     */
    omit?: WithdrawalOmit<ExtArgs> | null
    /**
     * Filter which Withdrawal to delete.
     */
    where: WithdrawalWhereUniqueInput
    relationLoadStrategy?: RelationLoadStrategy
  }

  /**
   * Withdrawal deleteMany
   */
  export type WithdrawalDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Withdrawals to delete
     */
    where?: WithdrawalWhereInput
    /**
     * Limit how many Withdrawals to delete.
     */
    limit?: number
  }

  /**
   * Withdrawal without action
   */
  export type WithdrawalDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Withdrawal
     */
    select?: WithdrawalSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Withdrawal
     */
    omit?: WithdrawalOmit<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const ProfileScalarFieldEnum: {
    id: 'id',
    walletAddress: 'walletAddress',
    privyUserId: 'privyUserId',
    role: 'role',
    referrerWallet: 'referrerWallet',
    encryptedMnemonic: 'encryptedMnemonic',
    mnemonicIv: 'mnemonicIv',
    mnemonicTag: 'mnemonicTag',
    isBanned: 'isBanned',
    runBalanceSol: 'runBalanceSol',
    creatorRewardsSol: 'creatorRewardsSol',
    referralRewardsSol: 'referralRewardsSol',
    ownerRewardsSol: 'ownerRewardsSol',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    lastSeenAt: 'lastSeenAt'
  };

  export type ProfileScalarFieldEnum = (typeof ProfileScalarFieldEnum)[keyof typeof ProfileScalarFieldEnum]


  export const RelationLoadStrategy: {
    query: 'query',
    join: 'join'
  };

  export type RelationLoadStrategy = (typeof RelationLoadStrategy)[keyof typeof RelationLoadStrategy]


  export const CoinScalarFieldEnum: {
    id: 'id',
    mintAddress: 'mintAddress',
    creatorWallet: 'creatorWallet',
    name: 'name',
    symbol: 'symbol',
    description: 'description',
    imageUri: 'imageUri',
    metadataUri: 'metadataUri',
    status: 'status',
    version: 'version',
    virtualSolReserves: 'virtualSolReserves',
    virtualTokenReserves: 'virtualTokenReserves',
    realSolReserves: 'realSolReserves',
    realTokenReserves: 'realTokenReserves',
    totalFeesCollected: 'totalFeesCollected',
    creatorFeeSnapshot: 'creatorFeeSnapshot',
    referrerFeeSnapshot: 'referrerFeeSnapshot',
    referrerWallet: 'referrerWallet',
    graduationInitiatedAt: 'graduationInitiatedAt',
    graduationCompletedAt: 'graduationCompletedAt',
    raydiumPoolAddress: 'raydiumPoolAddress',
    lpMintAddress: 'lpMintAddress',
    lpTokensBurned: 'lpTokensBurned',
    mintAuthorityRevoked: 'mintAuthorityRevoked',
    freezeAuthorityRevoked: 'freezeAuthorityRevoked',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type CoinScalarFieldEnum = (typeof CoinScalarFieldEnum)[keyof typeof CoinScalarFieldEnum]


  export const HoldingScalarFieldEnum: {
    id: 'id',
    walletAddress: 'walletAddress',
    coinId: 'coinId',
    tokenBalance: 'tokenBalance',
    costBasisSol: 'costBasisSol',
    totalBought: 'totalBought',
    totalSold: 'totalSold',
    updatedAt: 'updatedAt'
  };

  export type HoldingScalarFieldEnum = (typeof HoldingScalarFieldEnum)[keyof typeof HoldingScalarFieldEnum]


  export const TransactionScalarFieldEnum: {
    id: 'id',
    coinId: 'coinId',
    walletAddress: 'walletAddress',
    tradeType: 'tradeType',
    txSignature: 'txSignature',
    slot: 'slot',
    solAmount: 'solAmount',
    tokenAmount: 'tokenAmount',
    pricePerToken: 'pricePerToken',
    totalFee: 'totalFee',
    creatorFee: 'creatorFee',
    referrerFee: 'referrerFee',
    treasuryFee: 'treasuryFee',
    virtualSolAfter: 'virtualSolAfter',
    virtualTokensAfter: 'virtualTokensAfter',
    confirmedAt: 'confirmedAt',
    createdAt: 'createdAt'
  };

  export type TransactionScalarFieldEnum = (typeof TransactionScalarFieldEnum)[keyof typeof TransactionScalarFieldEnum]


  export const CandleScalarFieldEnum: {
    id: 'id',
    coinId: 'coinId',
    timeframe: 'timeframe',
    openTime: 'openTime',
    open: 'open',
    high: 'high',
    low: 'low',
    close: 'close',
    volume: 'volume',
    trades: 'trades',
    updatedAt: 'updatedAt'
  };

  export type CandleScalarFieldEnum = (typeof CandleScalarFieldEnum)[keyof typeof CandleScalarFieldEnum]


  export const ReferralAccountScalarFieldEnum: {
    id: 'id',
    walletAddress: 'walletAddress',
    totalFeesEarned: 'totalFeesEarned',
    totalFeesClaimed: 'totalFeesClaimed',
    pendingFees: 'pendingFees',
    referralCount: 'referralCount',
    lastClaimedAt: 'lastClaimedAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type ReferralAccountScalarFieldEnum = (typeof ReferralAccountScalarFieldEnum)[keyof typeof ReferralAccountScalarFieldEnum]


  export const TreasuryEventScalarFieldEnum: {
    id: 'id',
    eventType: 'eventType',
    coinId: 'coinId',
    txSignature: 'txSignature',
    amountLamports: 'amountLamports',
    cumulativeTotal: 'cumulativeTotal',
    memo: 'memo',
    createdAt: 'createdAt'
  };

  export type TreasuryEventScalarFieldEnum = (typeof TreasuryEventScalarFieldEnum)[keyof typeof TreasuryEventScalarFieldEnum]


  export const AuditLogScalarFieldEnum: {
    id: 'id',
    action: 'action',
    actorWallet: 'actorWallet',
    targetId: 'targetId',
    oldValue: 'oldValue',
    newValue: 'newValue',
    txSignature: 'txSignature',
    ipAddress: 'ipAddress',
    userAgent: 'userAgent',
    createdAt: 'createdAt'
  };

  export type AuditLogScalarFieldEnum = (typeof AuditLogScalarFieldEnum)[keyof typeof AuditLogScalarFieldEnum]


  export const IndexerStateScalarFieldEnum: {
    id: 'id',
    lastSlot: 'lastSlot',
    lastSignature: 'lastSignature',
    isHealthy: 'isHealthy',
    errorMessage: 'errorMessage',
    updatedAt: 'updatedAt'
  };

  export type IndexerStateScalarFieldEnum = (typeof IndexerStateScalarFieldEnum)[keyof typeof IndexerStateScalarFieldEnum]


  export const PendingTxScalarFieldEnum: {
    id: 'id',
    idempotencyKey: 'idempotencyKey',
    walletAddress: 'walletAddress',
    operationType: 'operationType',
    coinId: 'coinId',
    status: 'status',
    serializedTx: 'serializedTx',
    signature: 'signature',
    blockhash: 'blockhash',
    lastValidBlockHeight: 'lastValidBlockHeight',
    confirmedSlot: 'confirmedSlot',
    finalizedAt: 'finalizedAt',
    errorMessage: 'errorMessage',
    errorCode: 'errorCode',
    canResubmit: 'canResubmit',
    submitAttempts: 'submitAttempts',
    lastSubmittedAt: 'lastSubmittedAt',
    expiresAt: 'expiresAt',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PendingTxScalarFieldEnum = (typeof PendingTxScalarFieldEnum)[keyof typeof PendingTxScalarFieldEnum]


  export const PushSubscriptionScalarFieldEnum: {
    id: 'id',
    walletAddress: 'walletAddress',
    platform: 'platform',
    token: 'token',
    isActive: 'isActive',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type PushSubscriptionScalarFieldEnum = (typeof PushSubscriptionScalarFieldEnum)[keyof typeof PushSubscriptionScalarFieldEnum]


  export const DepositScalarFieldEnum: {
    id: 'id',
    walletAddress: 'walletAddress',
    txSignature: 'txSignature',
    amountSol: 'amountSol',
    status: 'status',
    createdAt: 'createdAt'
  };

  export type DepositScalarFieldEnum = (typeof DepositScalarFieldEnum)[keyof typeof DepositScalarFieldEnum]


  export const DepositScanScalarFieldEnum: {
    walletAddress: 'walletAddress',
    lastSignature: 'lastSignature',
    updatedAt: 'updatedAt'
  };

  export type DepositScanScalarFieldEnum = (typeof DepositScanScalarFieldEnum)[keyof typeof DepositScanScalarFieldEnum]


  export const WithdrawalScalarFieldEnum: {
    id: 'id',
    walletAddress: 'walletAddress',
    destination: 'destination',
    amountSol: 'amountSol',
    txSignature: 'txSignature',
    status: 'status',
    idempotencyKey: 'idempotencyKey',
    createdAt: 'createdAt'
  };

  export type WithdrawalScalarFieldEnum = (typeof WithdrawalScalarFieldEnum)[keyof typeof WithdrawalScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'String[]'
   */
  export type ListStringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String[]'>
    


  /**
   * Reference to a field of type 'UserRole'
   */
  export type EnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole'>
    


  /**
   * Reference to a field of type 'UserRole[]'
   */
  export type ListEnumUserRoleFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserRole[]'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Decimal[]'
   */
  export type ListDecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal[]'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'DateTime[]'
   */
  export type ListDateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime[]'>
    


  /**
   * Reference to a field of type 'CoinStatus'
   */
  export type EnumCoinStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CoinStatus'>
    


  /**
   * Reference to a field of type 'CoinStatus[]'
   */
  export type ListEnumCoinStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'CoinStatus[]'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'Int[]'
   */
  export type ListIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int[]'>
    


  /**
   * Reference to a field of type 'TradeType'
   */
  export type EnumTradeTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TradeType'>
    


  /**
   * Reference to a field of type 'TradeType[]'
   */
  export type ListEnumTradeTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TradeType[]'>
    


  /**
   * Reference to a field of type 'BigInt'
   */
  export type BigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt'>
    


  /**
   * Reference to a field of type 'BigInt[]'
   */
  export type ListBigIntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'BigInt[]'>
    


  /**
   * Reference to a field of type 'Timeframe'
   */
  export type EnumTimeframeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Timeframe'>
    


  /**
   * Reference to a field of type 'Timeframe[]'
   */
  export type ListEnumTimeframeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Timeframe[]'>
    


  /**
   * Reference to a field of type 'AuditAction'
   */
  export type EnumAuditActionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AuditAction'>
    


  /**
   * Reference to a field of type 'AuditAction[]'
   */
  export type ListEnumAuditActionFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AuditAction[]'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'TxStatus'
   */
  export type EnumTxStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TxStatus'>
    


  /**
   * Reference to a field of type 'TxStatus[]'
   */
  export type ListEnumTxStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TxStatus[]'>
    


  /**
   * Reference to a field of type 'Bytes'
   */
  export type BytesFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Bytes'>
    


  /**
   * Reference to a field of type 'Bytes[]'
   */
  export type ListBytesFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Bytes[]'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    


  /**
   * Reference to a field of type 'Float[]'
   */
  export type ListFloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float[]'>
    
  /**
   * Deep Input Types
   */


  export type ProfileWhereInput = {
    AND?: ProfileWhereInput | ProfileWhereInput[]
    OR?: ProfileWhereInput[]
    NOT?: ProfileWhereInput | ProfileWhereInput[]
    id?: StringFilter<"Profile"> | string
    walletAddress?: StringFilter<"Profile"> | string
    privyUserId?: StringFilter<"Profile"> | string
    role?: EnumUserRoleFilter<"Profile"> | $Enums.UserRole
    referrerWallet?: StringNullableFilter<"Profile"> | string | null
    encryptedMnemonic?: StringNullableFilter<"Profile"> | string | null
    mnemonicIv?: StringNullableFilter<"Profile"> | string | null
    mnemonicTag?: StringNullableFilter<"Profile"> | string | null
    isBanned?: BoolFilter<"Profile"> | boolean
    runBalanceSol?: DecimalFilter<"Profile"> | Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: DecimalFilter<"Profile"> | Decimal | DecimalJsLike | number | string
    referralRewardsSol?: DecimalFilter<"Profile"> | Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: DecimalFilter<"Profile"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"Profile"> | Date | string
    updatedAt?: DateTimeFilter<"Profile"> | Date | string
    lastSeenAt?: DateTimeNullableFilter<"Profile"> | Date | string | null
    coins?: CoinListRelationFilter
    transactions?: TransactionListRelationFilter
    holdings?: HoldingListRelationFilter
  }

  export type ProfileOrderByWithRelationInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    privyUserId?: SortOrder
    role?: SortOrder
    referrerWallet?: SortOrderInput | SortOrder
    encryptedMnemonic?: SortOrderInput | SortOrder
    mnemonicIv?: SortOrderInput | SortOrder
    mnemonicTag?: SortOrderInput | SortOrder
    isBanned?: SortOrder
    runBalanceSol?: SortOrder
    creatorRewardsSol?: SortOrder
    referralRewardsSol?: SortOrder
    ownerRewardsSol?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastSeenAt?: SortOrderInput | SortOrder
    coins?: CoinOrderByRelationAggregateInput
    transactions?: TransactionOrderByRelationAggregateInput
    holdings?: HoldingOrderByRelationAggregateInput
  }

  export type ProfileWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    walletAddress?: string
    privyUserId?: string
    AND?: ProfileWhereInput | ProfileWhereInput[]
    OR?: ProfileWhereInput[]
    NOT?: ProfileWhereInput | ProfileWhereInput[]
    role?: EnumUserRoleFilter<"Profile"> | $Enums.UserRole
    referrerWallet?: StringNullableFilter<"Profile"> | string | null
    encryptedMnemonic?: StringNullableFilter<"Profile"> | string | null
    mnemonicIv?: StringNullableFilter<"Profile"> | string | null
    mnemonicTag?: StringNullableFilter<"Profile"> | string | null
    isBanned?: BoolFilter<"Profile"> | boolean
    runBalanceSol?: DecimalFilter<"Profile"> | Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: DecimalFilter<"Profile"> | Decimal | DecimalJsLike | number | string
    referralRewardsSol?: DecimalFilter<"Profile"> | Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: DecimalFilter<"Profile"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFilter<"Profile"> | Date | string
    updatedAt?: DateTimeFilter<"Profile"> | Date | string
    lastSeenAt?: DateTimeNullableFilter<"Profile"> | Date | string | null
    coins?: CoinListRelationFilter
    transactions?: TransactionListRelationFilter
    holdings?: HoldingListRelationFilter
  }, "id" | "walletAddress" | "privyUserId">

  export type ProfileOrderByWithAggregationInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    privyUserId?: SortOrder
    role?: SortOrder
    referrerWallet?: SortOrderInput | SortOrder
    encryptedMnemonic?: SortOrderInput | SortOrder
    mnemonicIv?: SortOrderInput | SortOrder
    mnemonicTag?: SortOrderInput | SortOrder
    isBanned?: SortOrder
    runBalanceSol?: SortOrder
    creatorRewardsSol?: SortOrder
    referralRewardsSol?: SortOrder
    ownerRewardsSol?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastSeenAt?: SortOrderInput | SortOrder
    _count?: ProfileCountOrderByAggregateInput
    _avg?: ProfileAvgOrderByAggregateInput
    _max?: ProfileMaxOrderByAggregateInput
    _min?: ProfileMinOrderByAggregateInput
    _sum?: ProfileSumOrderByAggregateInput
  }

  export type ProfileScalarWhereWithAggregatesInput = {
    AND?: ProfileScalarWhereWithAggregatesInput | ProfileScalarWhereWithAggregatesInput[]
    OR?: ProfileScalarWhereWithAggregatesInput[]
    NOT?: ProfileScalarWhereWithAggregatesInput | ProfileScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Profile"> | string
    walletAddress?: StringWithAggregatesFilter<"Profile"> | string
    privyUserId?: StringWithAggregatesFilter<"Profile"> | string
    role?: EnumUserRoleWithAggregatesFilter<"Profile"> | $Enums.UserRole
    referrerWallet?: StringNullableWithAggregatesFilter<"Profile"> | string | null
    encryptedMnemonic?: StringNullableWithAggregatesFilter<"Profile"> | string | null
    mnemonicIv?: StringNullableWithAggregatesFilter<"Profile"> | string | null
    mnemonicTag?: StringNullableWithAggregatesFilter<"Profile"> | string | null
    isBanned?: BoolWithAggregatesFilter<"Profile"> | boolean
    runBalanceSol?: DecimalWithAggregatesFilter<"Profile"> | Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: DecimalWithAggregatesFilter<"Profile"> | Decimal | DecimalJsLike | number | string
    referralRewardsSol?: DecimalWithAggregatesFilter<"Profile"> | Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: DecimalWithAggregatesFilter<"Profile"> | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeWithAggregatesFilter<"Profile"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Profile"> | Date | string
    lastSeenAt?: DateTimeNullableWithAggregatesFilter<"Profile"> | Date | string | null
  }

  export type CoinWhereInput = {
    AND?: CoinWhereInput | CoinWhereInput[]
    OR?: CoinWhereInput[]
    NOT?: CoinWhereInput | CoinWhereInput[]
    id?: StringFilter<"Coin"> | string
    mintAddress?: StringFilter<"Coin"> | string
    creatorWallet?: StringFilter<"Coin"> | string
    name?: StringFilter<"Coin"> | string
    symbol?: StringFilter<"Coin"> | string
    description?: StringFilter<"Coin"> | string
    imageUri?: StringFilter<"Coin"> | string
    metadataUri?: StringNullableFilter<"Coin"> | string | null
    status?: EnumCoinStatusFilter<"Coin"> | $Enums.CoinStatus
    version?: IntFilter<"Coin"> | number
    virtualSolReserves?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: DecimalNullableFilter<"Coin"> | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: DecimalNullableFilter<"Coin"> | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: StringNullableFilter<"Coin"> | string | null
    graduationInitiatedAt?: DateTimeNullableFilter<"Coin"> | Date | string | null
    graduationCompletedAt?: DateTimeNullableFilter<"Coin"> | Date | string | null
    raydiumPoolAddress?: StringNullableFilter<"Coin"> | string | null
    lpMintAddress?: StringNullableFilter<"Coin"> | string | null
    lpTokensBurned?: BoolFilter<"Coin"> | boolean
    mintAuthorityRevoked?: BoolFilter<"Coin"> | boolean
    freezeAuthorityRevoked?: BoolFilter<"Coin"> | boolean
    createdAt?: DateTimeFilter<"Coin"> | Date | string
    updatedAt?: DateTimeFilter<"Coin"> | Date | string
    creator?: XOR<ProfileScalarRelationFilter, ProfileWhereInput>
    transactions?: TransactionListRelationFilter
    holdings?: HoldingListRelationFilter
    candles?: CandleListRelationFilter
  }

  export type CoinOrderByWithRelationInput = {
    id?: SortOrder
    mintAddress?: SortOrder
    creatorWallet?: SortOrder
    name?: SortOrder
    symbol?: SortOrder
    description?: SortOrder
    imageUri?: SortOrder
    metadataUri?: SortOrderInput | SortOrder
    status?: SortOrder
    version?: SortOrder
    virtualSolReserves?: SortOrder
    virtualTokenReserves?: SortOrder
    realSolReserves?: SortOrder
    realTokenReserves?: SortOrder
    totalFeesCollected?: SortOrder
    creatorFeeSnapshot?: SortOrderInput | SortOrder
    referrerFeeSnapshot?: SortOrderInput | SortOrder
    referrerWallet?: SortOrderInput | SortOrder
    graduationInitiatedAt?: SortOrderInput | SortOrder
    graduationCompletedAt?: SortOrderInput | SortOrder
    raydiumPoolAddress?: SortOrderInput | SortOrder
    lpMintAddress?: SortOrderInput | SortOrder
    lpTokensBurned?: SortOrder
    mintAuthorityRevoked?: SortOrder
    freezeAuthorityRevoked?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    creator?: ProfileOrderByWithRelationInput
    transactions?: TransactionOrderByRelationAggregateInput
    holdings?: HoldingOrderByRelationAggregateInput
    candles?: CandleOrderByRelationAggregateInput
  }

  export type CoinWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    mintAddress?: string
    AND?: CoinWhereInput | CoinWhereInput[]
    OR?: CoinWhereInput[]
    NOT?: CoinWhereInput | CoinWhereInput[]
    creatorWallet?: StringFilter<"Coin"> | string
    name?: StringFilter<"Coin"> | string
    symbol?: StringFilter<"Coin"> | string
    description?: StringFilter<"Coin"> | string
    imageUri?: StringFilter<"Coin"> | string
    metadataUri?: StringNullableFilter<"Coin"> | string | null
    status?: EnumCoinStatusFilter<"Coin"> | $Enums.CoinStatus
    version?: IntFilter<"Coin"> | number
    virtualSolReserves?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: DecimalNullableFilter<"Coin"> | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: DecimalNullableFilter<"Coin"> | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: StringNullableFilter<"Coin"> | string | null
    graduationInitiatedAt?: DateTimeNullableFilter<"Coin"> | Date | string | null
    graduationCompletedAt?: DateTimeNullableFilter<"Coin"> | Date | string | null
    raydiumPoolAddress?: StringNullableFilter<"Coin"> | string | null
    lpMintAddress?: StringNullableFilter<"Coin"> | string | null
    lpTokensBurned?: BoolFilter<"Coin"> | boolean
    mintAuthorityRevoked?: BoolFilter<"Coin"> | boolean
    freezeAuthorityRevoked?: BoolFilter<"Coin"> | boolean
    createdAt?: DateTimeFilter<"Coin"> | Date | string
    updatedAt?: DateTimeFilter<"Coin"> | Date | string
    creator?: XOR<ProfileScalarRelationFilter, ProfileWhereInput>
    transactions?: TransactionListRelationFilter
    holdings?: HoldingListRelationFilter
    candles?: CandleListRelationFilter
  }, "id" | "mintAddress">

  export type CoinOrderByWithAggregationInput = {
    id?: SortOrder
    mintAddress?: SortOrder
    creatorWallet?: SortOrder
    name?: SortOrder
    symbol?: SortOrder
    description?: SortOrder
    imageUri?: SortOrder
    metadataUri?: SortOrderInput | SortOrder
    status?: SortOrder
    version?: SortOrder
    virtualSolReserves?: SortOrder
    virtualTokenReserves?: SortOrder
    realSolReserves?: SortOrder
    realTokenReserves?: SortOrder
    totalFeesCollected?: SortOrder
    creatorFeeSnapshot?: SortOrderInput | SortOrder
    referrerFeeSnapshot?: SortOrderInput | SortOrder
    referrerWallet?: SortOrderInput | SortOrder
    graduationInitiatedAt?: SortOrderInput | SortOrder
    graduationCompletedAt?: SortOrderInput | SortOrder
    raydiumPoolAddress?: SortOrderInput | SortOrder
    lpMintAddress?: SortOrderInput | SortOrder
    lpTokensBurned?: SortOrder
    mintAuthorityRevoked?: SortOrder
    freezeAuthorityRevoked?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: CoinCountOrderByAggregateInput
    _avg?: CoinAvgOrderByAggregateInput
    _max?: CoinMaxOrderByAggregateInput
    _min?: CoinMinOrderByAggregateInput
    _sum?: CoinSumOrderByAggregateInput
  }

  export type CoinScalarWhereWithAggregatesInput = {
    AND?: CoinScalarWhereWithAggregatesInput | CoinScalarWhereWithAggregatesInput[]
    OR?: CoinScalarWhereWithAggregatesInput[]
    NOT?: CoinScalarWhereWithAggregatesInput | CoinScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Coin"> | string
    mintAddress?: StringWithAggregatesFilter<"Coin"> | string
    creatorWallet?: StringWithAggregatesFilter<"Coin"> | string
    name?: StringWithAggregatesFilter<"Coin"> | string
    symbol?: StringWithAggregatesFilter<"Coin"> | string
    description?: StringWithAggregatesFilter<"Coin"> | string
    imageUri?: StringWithAggregatesFilter<"Coin"> | string
    metadataUri?: StringNullableWithAggregatesFilter<"Coin"> | string | null
    status?: EnumCoinStatusWithAggregatesFilter<"Coin"> | $Enums.CoinStatus
    version?: IntWithAggregatesFilter<"Coin"> | number
    virtualSolReserves?: DecimalWithAggregatesFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalWithAggregatesFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalWithAggregatesFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalWithAggregatesFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalWithAggregatesFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: DecimalNullableWithAggregatesFilter<"Coin"> | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: DecimalNullableWithAggregatesFilter<"Coin"> | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: StringNullableWithAggregatesFilter<"Coin"> | string | null
    graduationInitiatedAt?: DateTimeNullableWithAggregatesFilter<"Coin"> | Date | string | null
    graduationCompletedAt?: DateTimeNullableWithAggregatesFilter<"Coin"> | Date | string | null
    raydiumPoolAddress?: StringNullableWithAggregatesFilter<"Coin"> | string | null
    lpMintAddress?: StringNullableWithAggregatesFilter<"Coin"> | string | null
    lpTokensBurned?: BoolWithAggregatesFilter<"Coin"> | boolean
    mintAuthorityRevoked?: BoolWithAggregatesFilter<"Coin"> | boolean
    freezeAuthorityRevoked?: BoolWithAggregatesFilter<"Coin"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"Coin"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"Coin"> | Date | string
  }

  export type HoldingWhereInput = {
    AND?: HoldingWhereInput | HoldingWhereInput[]
    OR?: HoldingWhereInput[]
    NOT?: HoldingWhereInput | HoldingWhereInput[]
    id?: StringFilter<"Holding"> | string
    walletAddress?: StringFilter<"Holding"> | string
    coinId?: StringFilter<"Holding"> | string
    tokenBalance?: DecimalFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    costBasisSol?: DecimalFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    totalBought?: DecimalFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    totalSold?: DecimalFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFilter<"Holding"> | Date | string
    profile?: XOR<ProfileScalarRelationFilter, ProfileWhereInput>
    coin?: XOR<CoinScalarRelationFilter, CoinWhereInput>
  }

  export type HoldingOrderByWithRelationInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    coinId?: SortOrder
    tokenBalance?: SortOrder
    costBasisSol?: SortOrder
    totalBought?: SortOrder
    totalSold?: SortOrder
    updatedAt?: SortOrder
    profile?: ProfileOrderByWithRelationInput
    coin?: CoinOrderByWithRelationInput
  }

  export type HoldingWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    walletAddress_coinId?: HoldingWalletAddressCoinIdCompoundUniqueInput
    AND?: HoldingWhereInput | HoldingWhereInput[]
    OR?: HoldingWhereInput[]
    NOT?: HoldingWhereInput | HoldingWhereInput[]
    walletAddress?: StringFilter<"Holding"> | string
    coinId?: StringFilter<"Holding"> | string
    tokenBalance?: DecimalFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    costBasisSol?: DecimalFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    totalBought?: DecimalFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    totalSold?: DecimalFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFilter<"Holding"> | Date | string
    profile?: XOR<ProfileScalarRelationFilter, ProfileWhereInput>
    coin?: XOR<CoinScalarRelationFilter, CoinWhereInput>
  }, "id" | "walletAddress_coinId">

  export type HoldingOrderByWithAggregationInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    coinId?: SortOrder
    tokenBalance?: SortOrder
    costBasisSol?: SortOrder
    totalBought?: SortOrder
    totalSold?: SortOrder
    updatedAt?: SortOrder
    _count?: HoldingCountOrderByAggregateInput
    _avg?: HoldingAvgOrderByAggregateInput
    _max?: HoldingMaxOrderByAggregateInput
    _min?: HoldingMinOrderByAggregateInput
    _sum?: HoldingSumOrderByAggregateInput
  }

  export type HoldingScalarWhereWithAggregatesInput = {
    AND?: HoldingScalarWhereWithAggregatesInput | HoldingScalarWhereWithAggregatesInput[]
    OR?: HoldingScalarWhereWithAggregatesInput[]
    NOT?: HoldingScalarWhereWithAggregatesInput | HoldingScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Holding"> | string
    walletAddress?: StringWithAggregatesFilter<"Holding"> | string
    coinId?: StringWithAggregatesFilter<"Holding"> | string
    tokenBalance?: DecimalWithAggregatesFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    costBasisSol?: DecimalWithAggregatesFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    totalBought?: DecimalWithAggregatesFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    totalSold?: DecimalWithAggregatesFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeWithAggregatesFilter<"Holding"> | Date | string
  }

  export type TransactionWhereInput = {
    AND?: TransactionWhereInput | TransactionWhereInput[]
    OR?: TransactionWhereInput[]
    NOT?: TransactionWhereInput | TransactionWhereInput[]
    id?: StringFilter<"Transaction"> | string
    coinId?: StringFilter<"Transaction"> | string
    walletAddress?: StringFilter<"Transaction"> | string
    tradeType?: EnumTradeTypeFilter<"Transaction"> | $Enums.TradeType
    txSignature?: StringFilter<"Transaction"> | string
    slot?: BigIntFilter<"Transaction"> | bigint | number
    solAmount?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    tokenAmount?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    pricePerToken?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    totalFee?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    creatorFee?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    referrerFee?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    treasuryFee?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    virtualSolAfter?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    virtualTokensAfter?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    confirmedAt?: DateTimeFilter<"Transaction"> | Date | string
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
    coin?: XOR<CoinScalarRelationFilter, CoinWhereInput>
    profile?: XOR<ProfileScalarRelationFilter, ProfileWhereInput>
  }

  export type TransactionOrderByWithRelationInput = {
    id?: SortOrder
    coinId?: SortOrder
    walletAddress?: SortOrder
    tradeType?: SortOrder
    txSignature?: SortOrder
    slot?: SortOrder
    solAmount?: SortOrder
    tokenAmount?: SortOrder
    pricePerToken?: SortOrder
    totalFee?: SortOrder
    creatorFee?: SortOrder
    referrerFee?: SortOrder
    treasuryFee?: SortOrder
    virtualSolAfter?: SortOrder
    virtualTokensAfter?: SortOrder
    confirmedAt?: SortOrder
    createdAt?: SortOrder
    coin?: CoinOrderByWithRelationInput
    profile?: ProfileOrderByWithRelationInput
  }

  export type TransactionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    txSignature?: string
    AND?: TransactionWhereInput | TransactionWhereInput[]
    OR?: TransactionWhereInput[]
    NOT?: TransactionWhereInput | TransactionWhereInput[]
    coinId?: StringFilter<"Transaction"> | string
    walletAddress?: StringFilter<"Transaction"> | string
    tradeType?: EnumTradeTypeFilter<"Transaction"> | $Enums.TradeType
    slot?: BigIntFilter<"Transaction"> | bigint | number
    solAmount?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    tokenAmount?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    pricePerToken?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    totalFee?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    creatorFee?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    referrerFee?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    treasuryFee?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    virtualSolAfter?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    virtualTokensAfter?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    confirmedAt?: DateTimeFilter<"Transaction"> | Date | string
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
    coin?: XOR<CoinScalarRelationFilter, CoinWhereInput>
    profile?: XOR<ProfileScalarRelationFilter, ProfileWhereInput>
  }, "id" | "txSignature">

  export type TransactionOrderByWithAggregationInput = {
    id?: SortOrder
    coinId?: SortOrder
    walletAddress?: SortOrder
    tradeType?: SortOrder
    txSignature?: SortOrder
    slot?: SortOrder
    solAmount?: SortOrder
    tokenAmount?: SortOrder
    pricePerToken?: SortOrder
    totalFee?: SortOrder
    creatorFee?: SortOrder
    referrerFee?: SortOrder
    treasuryFee?: SortOrder
    virtualSolAfter?: SortOrder
    virtualTokensAfter?: SortOrder
    confirmedAt?: SortOrder
    createdAt?: SortOrder
    _count?: TransactionCountOrderByAggregateInput
    _avg?: TransactionAvgOrderByAggregateInput
    _max?: TransactionMaxOrderByAggregateInput
    _min?: TransactionMinOrderByAggregateInput
    _sum?: TransactionSumOrderByAggregateInput
  }

  export type TransactionScalarWhereWithAggregatesInput = {
    AND?: TransactionScalarWhereWithAggregatesInput | TransactionScalarWhereWithAggregatesInput[]
    OR?: TransactionScalarWhereWithAggregatesInput[]
    NOT?: TransactionScalarWhereWithAggregatesInput | TransactionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Transaction"> | string
    coinId?: StringWithAggregatesFilter<"Transaction"> | string
    walletAddress?: StringWithAggregatesFilter<"Transaction"> | string
    tradeType?: EnumTradeTypeWithAggregatesFilter<"Transaction"> | $Enums.TradeType
    txSignature?: StringWithAggregatesFilter<"Transaction"> | string
    slot?: BigIntWithAggregatesFilter<"Transaction"> | bigint | number
    solAmount?: DecimalWithAggregatesFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    tokenAmount?: DecimalWithAggregatesFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    pricePerToken?: DecimalWithAggregatesFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    totalFee?: DecimalWithAggregatesFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    creatorFee?: DecimalWithAggregatesFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    referrerFee?: DecimalWithAggregatesFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    treasuryFee?: DecimalWithAggregatesFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    virtualSolAfter?: DecimalWithAggregatesFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    virtualTokensAfter?: DecimalWithAggregatesFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    confirmedAt?: DateTimeWithAggregatesFilter<"Transaction"> | Date | string
    createdAt?: DateTimeWithAggregatesFilter<"Transaction"> | Date | string
  }

  export type CandleWhereInput = {
    AND?: CandleWhereInput | CandleWhereInput[]
    OR?: CandleWhereInput[]
    NOT?: CandleWhereInput | CandleWhereInput[]
    id?: StringFilter<"Candle"> | string
    coinId?: StringFilter<"Candle"> | string
    timeframe?: EnumTimeframeFilter<"Candle"> | $Enums.Timeframe
    openTime?: BigIntFilter<"Candle"> | bigint | number
    open?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    high?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    low?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    close?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    volume?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    trades?: IntFilter<"Candle"> | number
    updatedAt?: DateTimeFilter<"Candle"> | Date | string
    coin?: XOR<CoinScalarRelationFilter, CoinWhereInput>
  }

  export type CandleOrderByWithRelationInput = {
    id?: SortOrder
    coinId?: SortOrder
    timeframe?: SortOrder
    openTime?: SortOrder
    open?: SortOrder
    high?: SortOrder
    low?: SortOrder
    close?: SortOrder
    volume?: SortOrder
    trades?: SortOrder
    updatedAt?: SortOrder
    coin?: CoinOrderByWithRelationInput
  }

  export type CandleWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    coinId_timeframe_openTime?: CandleCoinIdTimeframeOpenTimeCompoundUniqueInput
    AND?: CandleWhereInput | CandleWhereInput[]
    OR?: CandleWhereInput[]
    NOT?: CandleWhereInput | CandleWhereInput[]
    coinId?: StringFilter<"Candle"> | string
    timeframe?: EnumTimeframeFilter<"Candle"> | $Enums.Timeframe
    openTime?: BigIntFilter<"Candle"> | bigint | number
    open?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    high?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    low?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    close?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    volume?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    trades?: IntFilter<"Candle"> | number
    updatedAt?: DateTimeFilter<"Candle"> | Date | string
    coin?: XOR<CoinScalarRelationFilter, CoinWhereInput>
  }, "id" | "coinId_timeframe_openTime">

  export type CandleOrderByWithAggregationInput = {
    id?: SortOrder
    coinId?: SortOrder
    timeframe?: SortOrder
    openTime?: SortOrder
    open?: SortOrder
    high?: SortOrder
    low?: SortOrder
    close?: SortOrder
    volume?: SortOrder
    trades?: SortOrder
    updatedAt?: SortOrder
    _count?: CandleCountOrderByAggregateInput
    _avg?: CandleAvgOrderByAggregateInput
    _max?: CandleMaxOrderByAggregateInput
    _min?: CandleMinOrderByAggregateInput
    _sum?: CandleSumOrderByAggregateInput
  }

  export type CandleScalarWhereWithAggregatesInput = {
    AND?: CandleScalarWhereWithAggregatesInput | CandleScalarWhereWithAggregatesInput[]
    OR?: CandleScalarWhereWithAggregatesInput[]
    NOT?: CandleScalarWhereWithAggregatesInput | CandleScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Candle"> | string
    coinId?: StringWithAggregatesFilter<"Candle"> | string
    timeframe?: EnumTimeframeWithAggregatesFilter<"Candle"> | $Enums.Timeframe
    openTime?: BigIntWithAggregatesFilter<"Candle"> | bigint | number
    open?: DecimalWithAggregatesFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    high?: DecimalWithAggregatesFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    low?: DecimalWithAggregatesFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    close?: DecimalWithAggregatesFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    volume?: DecimalWithAggregatesFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    trades?: IntWithAggregatesFilter<"Candle"> | number
    updatedAt?: DateTimeWithAggregatesFilter<"Candle"> | Date | string
  }

  export type ReferralAccountWhereInput = {
    AND?: ReferralAccountWhereInput | ReferralAccountWhereInput[]
    OR?: ReferralAccountWhereInput[]
    NOT?: ReferralAccountWhereInput | ReferralAccountWhereInput[]
    id?: StringFilter<"ReferralAccount"> | string
    walletAddress?: StringFilter<"ReferralAccount"> | string
    totalFeesEarned?: DecimalFilter<"ReferralAccount"> | Decimal | DecimalJsLike | number | string
    totalFeesClaimed?: DecimalFilter<"ReferralAccount"> | Decimal | DecimalJsLike | number | string
    pendingFees?: DecimalFilter<"ReferralAccount"> | Decimal | DecimalJsLike | number | string
    referralCount?: IntFilter<"ReferralAccount"> | number
    lastClaimedAt?: DateTimeNullableFilter<"ReferralAccount"> | Date | string | null
    createdAt?: DateTimeFilter<"ReferralAccount"> | Date | string
    updatedAt?: DateTimeFilter<"ReferralAccount"> | Date | string
  }

  export type ReferralAccountOrderByWithRelationInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    totalFeesEarned?: SortOrder
    totalFeesClaimed?: SortOrder
    pendingFees?: SortOrder
    referralCount?: SortOrder
    lastClaimedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralAccountWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    walletAddress?: string
    AND?: ReferralAccountWhereInput | ReferralAccountWhereInput[]
    OR?: ReferralAccountWhereInput[]
    NOT?: ReferralAccountWhereInput | ReferralAccountWhereInput[]
    totalFeesEarned?: DecimalFilter<"ReferralAccount"> | Decimal | DecimalJsLike | number | string
    totalFeesClaimed?: DecimalFilter<"ReferralAccount"> | Decimal | DecimalJsLike | number | string
    pendingFees?: DecimalFilter<"ReferralAccount"> | Decimal | DecimalJsLike | number | string
    referralCount?: IntFilter<"ReferralAccount"> | number
    lastClaimedAt?: DateTimeNullableFilter<"ReferralAccount"> | Date | string | null
    createdAt?: DateTimeFilter<"ReferralAccount"> | Date | string
    updatedAt?: DateTimeFilter<"ReferralAccount"> | Date | string
  }, "id" | "walletAddress">

  export type ReferralAccountOrderByWithAggregationInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    totalFeesEarned?: SortOrder
    totalFeesClaimed?: SortOrder
    pendingFees?: SortOrder
    referralCount?: SortOrder
    lastClaimedAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: ReferralAccountCountOrderByAggregateInput
    _avg?: ReferralAccountAvgOrderByAggregateInput
    _max?: ReferralAccountMaxOrderByAggregateInput
    _min?: ReferralAccountMinOrderByAggregateInput
    _sum?: ReferralAccountSumOrderByAggregateInput
  }

  export type ReferralAccountScalarWhereWithAggregatesInput = {
    AND?: ReferralAccountScalarWhereWithAggregatesInput | ReferralAccountScalarWhereWithAggregatesInput[]
    OR?: ReferralAccountScalarWhereWithAggregatesInput[]
    NOT?: ReferralAccountScalarWhereWithAggregatesInput | ReferralAccountScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"ReferralAccount"> | string
    walletAddress?: StringWithAggregatesFilter<"ReferralAccount"> | string
    totalFeesEarned?: DecimalWithAggregatesFilter<"ReferralAccount"> | Decimal | DecimalJsLike | number | string
    totalFeesClaimed?: DecimalWithAggregatesFilter<"ReferralAccount"> | Decimal | DecimalJsLike | number | string
    pendingFees?: DecimalWithAggregatesFilter<"ReferralAccount"> | Decimal | DecimalJsLike | number | string
    referralCount?: IntWithAggregatesFilter<"ReferralAccount"> | number
    lastClaimedAt?: DateTimeNullableWithAggregatesFilter<"ReferralAccount"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"ReferralAccount"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"ReferralAccount"> | Date | string
  }

  export type TreasuryEventWhereInput = {
    AND?: TreasuryEventWhereInput | TreasuryEventWhereInput[]
    OR?: TreasuryEventWhereInput[]
    NOT?: TreasuryEventWhereInput | TreasuryEventWhereInput[]
    id?: StringFilter<"TreasuryEvent"> | string
    eventType?: StringFilter<"TreasuryEvent"> | string
    coinId?: StringNullableFilter<"TreasuryEvent"> | string | null
    txSignature?: StringNullableFilter<"TreasuryEvent"> | string | null
    amountLamports?: DecimalFilter<"TreasuryEvent"> | Decimal | DecimalJsLike | number | string
    cumulativeTotal?: DecimalFilter<"TreasuryEvent"> | Decimal | DecimalJsLike | number | string
    memo?: StringNullableFilter<"TreasuryEvent"> | string | null
    createdAt?: DateTimeFilter<"TreasuryEvent"> | Date | string
  }

  export type TreasuryEventOrderByWithRelationInput = {
    id?: SortOrder
    eventType?: SortOrder
    coinId?: SortOrderInput | SortOrder
    txSignature?: SortOrderInput | SortOrder
    amountLamports?: SortOrder
    cumulativeTotal?: SortOrder
    memo?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type TreasuryEventWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: TreasuryEventWhereInput | TreasuryEventWhereInput[]
    OR?: TreasuryEventWhereInput[]
    NOT?: TreasuryEventWhereInput | TreasuryEventWhereInput[]
    eventType?: StringFilter<"TreasuryEvent"> | string
    coinId?: StringNullableFilter<"TreasuryEvent"> | string | null
    txSignature?: StringNullableFilter<"TreasuryEvent"> | string | null
    amountLamports?: DecimalFilter<"TreasuryEvent"> | Decimal | DecimalJsLike | number | string
    cumulativeTotal?: DecimalFilter<"TreasuryEvent"> | Decimal | DecimalJsLike | number | string
    memo?: StringNullableFilter<"TreasuryEvent"> | string | null
    createdAt?: DateTimeFilter<"TreasuryEvent"> | Date | string
  }, "id">

  export type TreasuryEventOrderByWithAggregationInput = {
    id?: SortOrder
    eventType?: SortOrder
    coinId?: SortOrderInput | SortOrder
    txSignature?: SortOrderInput | SortOrder
    amountLamports?: SortOrder
    cumulativeTotal?: SortOrder
    memo?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: TreasuryEventCountOrderByAggregateInput
    _avg?: TreasuryEventAvgOrderByAggregateInput
    _max?: TreasuryEventMaxOrderByAggregateInput
    _min?: TreasuryEventMinOrderByAggregateInput
    _sum?: TreasuryEventSumOrderByAggregateInput
  }

  export type TreasuryEventScalarWhereWithAggregatesInput = {
    AND?: TreasuryEventScalarWhereWithAggregatesInput | TreasuryEventScalarWhereWithAggregatesInput[]
    OR?: TreasuryEventScalarWhereWithAggregatesInput[]
    NOT?: TreasuryEventScalarWhereWithAggregatesInput | TreasuryEventScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"TreasuryEvent"> | string
    eventType?: StringWithAggregatesFilter<"TreasuryEvent"> | string
    coinId?: StringNullableWithAggregatesFilter<"TreasuryEvent"> | string | null
    txSignature?: StringNullableWithAggregatesFilter<"TreasuryEvent"> | string | null
    amountLamports?: DecimalWithAggregatesFilter<"TreasuryEvent"> | Decimal | DecimalJsLike | number | string
    cumulativeTotal?: DecimalWithAggregatesFilter<"TreasuryEvent"> | Decimal | DecimalJsLike | number | string
    memo?: StringNullableWithAggregatesFilter<"TreasuryEvent"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"TreasuryEvent"> | Date | string
  }

  export type AuditLogWhereInput = {
    AND?: AuditLogWhereInput | AuditLogWhereInput[]
    OR?: AuditLogWhereInput[]
    NOT?: AuditLogWhereInput | AuditLogWhereInput[]
    id?: BigIntFilter<"AuditLog"> | bigint | number
    action?: EnumAuditActionFilter<"AuditLog"> | $Enums.AuditAction
    actorWallet?: StringFilter<"AuditLog"> | string
    targetId?: StringNullableFilter<"AuditLog"> | string | null
    oldValue?: JsonNullableFilter<"AuditLog">
    newValue?: JsonNullableFilter<"AuditLog">
    txSignature?: StringNullableFilter<"AuditLog"> | string | null
    ipAddress?: StringNullableFilter<"AuditLog"> | string | null
    userAgent?: StringNullableFilter<"AuditLog"> | string | null
    createdAt?: DateTimeFilter<"AuditLog"> | Date | string
  }

  export type AuditLogOrderByWithRelationInput = {
    id?: SortOrder
    action?: SortOrder
    actorWallet?: SortOrder
    targetId?: SortOrderInput | SortOrder
    oldValue?: SortOrderInput | SortOrder
    newValue?: SortOrderInput | SortOrder
    txSignature?: SortOrderInput | SortOrder
    ipAddress?: SortOrderInput | SortOrder
    userAgent?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type AuditLogWhereUniqueInput = Prisma.AtLeast<{
    id?: bigint | number
    AND?: AuditLogWhereInput | AuditLogWhereInput[]
    OR?: AuditLogWhereInput[]
    NOT?: AuditLogWhereInput | AuditLogWhereInput[]
    action?: EnumAuditActionFilter<"AuditLog"> | $Enums.AuditAction
    actorWallet?: StringFilter<"AuditLog"> | string
    targetId?: StringNullableFilter<"AuditLog"> | string | null
    oldValue?: JsonNullableFilter<"AuditLog">
    newValue?: JsonNullableFilter<"AuditLog">
    txSignature?: StringNullableFilter<"AuditLog"> | string | null
    ipAddress?: StringNullableFilter<"AuditLog"> | string | null
    userAgent?: StringNullableFilter<"AuditLog"> | string | null
    createdAt?: DateTimeFilter<"AuditLog"> | Date | string
  }, "id">

  export type AuditLogOrderByWithAggregationInput = {
    id?: SortOrder
    action?: SortOrder
    actorWallet?: SortOrder
    targetId?: SortOrderInput | SortOrder
    oldValue?: SortOrderInput | SortOrder
    newValue?: SortOrderInput | SortOrder
    txSignature?: SortOrderInput | SortOrder
    ipAddress?: SortOrderInput | SortOrder
    userAgent?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: AuditLogCountOrderByAggregateInput
    _avg?: AuditLogAvgOrderByAggregateInput
    _max?: AuditLogMaxOrderByAggregateInput
    _min?: AuditLogMinOrderByAggregateInput
    _sum?: AuditLogSumOrderByAggregateInput
  }

  export type AuditLogScalarWhereWithAggregatesInput = {
    AND?: AuditLogScalarWhereWithAggregatesInput | AuditLogScalarWhereWithAggregatesInput[]
    OR?: AuditLogScalarWhereWithAggregatesInput[]
    NOT?: AuditLogScalarWhereWithAggregatesInput | AuditLogScalarWhereWithAggregatesInput[]
    id?: BigIntWithAggregatesFilter<"AuditLog"> | bigint | number
    action?: EnumAuditActionWithAggregatesFilter<"AuditLog"> | $Enums.AuditAction
    actorWallet?: StringWithAggregatesFilter<"AuditLog"> | string
    targetId?: StringNullableWithAggregatesFilter<"AuditLog"> | string | null
    oldValue?: JsonNullableWithAggregatesFilter<"AuditLog">
    newValue?: JsonNullableWithAggregatesFilter<"AuditLog">
    txSignature?: StringNullableWithAggregatesFilter<"AuditLog"> | string | null
    ipAddress?: StringNullableWithAggregatesFilter<"AuditLog"> | string | null
    userAgent?: StringNullableWithAggregatesFilter<"AuditLog"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"AuditLog"> | Date | string
  }

  export type IndexerStateWhereInput = {
    AND?: IndexerStateWhereInput | IndexerStateWhereInput[]
    OR?: IndexerStateWhereInput[]
    NOT?: IndexerStateWhereInput | IndexerStateWhereInput[]
    id?: StringFilter<"IndexerState"> | string
    lastSlot?: BigIntFilter<"IndexerState"> | bigint | number
    lastSignature?: StringNullableFilter<"IndexerState"> | string | null
    isHealthy?: BoolFilter<"IndexerState"> | boolean
    errorMessage?: StringNullableFilter<"IndexerState"> | string | null
    updatedAt?: DateTimeFilter<"IndexerState"> | Date | string
  }

  export type IndexerStateOrderByWithRelationInput = {
    id?: SortOrder
    lastSlot?: SortOrder
    lastSignature?: SortOrderInput | SortOrder
    isHealthy?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
  }

  export type IndexerStateWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: IndexerStateWhereInput | IndexerStateWhereInput[]
    OR?: IndexerStateWhereInput[]
    NOT?: IndexerStateWhereInput | IndexerStateWhereInput[]
    lastSlot?: BigIntFilter<"IndexerState"> | bigint | number
    lastSignature?: StringNullableFilter<"IndexerState"> | string | null
    isHealthy?: BoolFilter<"IndexerState"> | boolean
    errorMessage?: StringNullableFilter<"IndexerState"> | string | null
    updatedAt?: DateTimeFilter<"IndexerState"> | Date | string
  }, "id">

  export type IndexerStateOrderByWithAggregationInput = {
    id?: SortOrder
    lastSlot?: SortOrder
    lastSignature?: SortOrderInput | SortOrder
    isHealthy?: SortOrder
    errorMessage?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    _count?: IndexerStateCountOrderByAggregateInput
    _avg?: IndexerStateAvgOrderByAggregateInput
    _max?: IndexerStateMaxOrderByAggregateInput
    _min?: IndexerStateMinOrderByAggregateInput
    _sum?: IndexerStateSumOrderByAggregateInput
  }

  export type IndexerStateScalarWhereWithAggregatesInput = {
    AND?: IndexerStateScalarWhereWithAggregatesInput | IndexerStateScalarWhereWithAggregatesInput[]
    OR?: IndexerStateScalarWhereWithAggregatesInput[]
    NOT?: IndexerStateScalarWhereWithAggregatesInput | IndexerStateScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"IndexerState"> | string
    lastSlot?: BigIntWithAggregatesFilter<"IndexerState"> | bigint | number
    lastSignature?: StringNullableWithAggregatesFilter<"IndexerState"> | string | null
    isHealthy?: BoolWithAggregatesFilter<"IndexerState"> | boolean
    errorMessage?: StringNullableWithAggregatesFilter<"IndexerState"> | string | null
    updatedAt?: DateTimeWithAggregatesFilter<"IndexerState"> | Date | string
  }

  export type PendingTxWhereInput = {
    AND?: PendingTxWhereInput | PendingTxWhereInput[]
    OR?: PendingTxWhereInput[]
    NOT?: PendingTxWhereInput | PendingTxWhereInput[]
    id?: StringFilter<"PendingTx"> | string
    idempotencyKey?: StringFilter<"PendingTx"> | string
    walletAddress?: StringFilter<"PendingTx"> | string
    operationType?: StringFilter<"PendingTx"> | string
    coinId?: StringNullableFilter<"PendingTx"> | string | null
    status?: EnumTxStatusFilter<"PendingTx"> | $Enums.TxStatus
    serializedTx?: BytesNullableFilter<"PendingTx"> | Bytes | null
    signature?: StringNullableFilter<"PendingTx"> | string | null
    blockhash?: StringNullableFilter<"PendingTx"> | string | null
    lastValidBlockHeight?: BigIntNullableFilter<"PendingTx"> | bigint | number | null
    confirmedSlot?: BigIntNullableFilter<"PendingTx"> | bigint | number | null
    finalizedAt?: DateTimeNullableFilter<"PendingTx"> | Date | string | null
    errorMessage?: StringNullableFilter<"PendingTx"> | string | null
    errorCode?: StringNullableFilter<"PendingTx"> | string | null
    canResubmit?: BoolFilter<"PendingTx"> | boolean
    submitAttempts?: IntFilter<"PendingTx"> | number
    lastSubmittedAt?: DateTimeNullableFilter<"PendingTx"> | Date | string | null
    expiresAt?: DateTimeNullableFilter<"PendingTx"> | Date | string | null
    createdAt?: DateTimeFilter<"PendingTx"> | Date | string
    updatedAt?: DateTimeFilter<"PendingTx"> | Date | string
  }

  export type PendingTxOrderByWithRelationInput = {
    id?: SortOrder
    idempotencyKey?: SortOrder
    walletAddress?: SortOrder
    operationType?: SortOrder
    coinId?: SortOrderInput | SortOrder
    status?: SortOrder
    serializedTx?: SortOrderInput | SortOrder
    signature?: SortOrderInput | SortOrder
    blockhash?: SortOrderInput | SortOrder
    lastValidBlockHeight?: SortOrderInput | SortOrder
    confirmedSlot?: SortOrderInput | SortOrder
    finalizedAt?: SortOrderInput | SortOrder
    errorMessage?: SortOrderInput | SortOrder
    errorCode?: SortOrderInput | SortOrder
    canResubmit?: SortOrder
    submitAttempts?: SortOrder
    lastSubmittedAt?: SortOrderInput | SortOrder
    expiresAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PendingTxWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    idempotencyKey?: string
    signature?: string
    AND?: PendingTxWhereInput | PendingTxWhereInput[]
    OR?: PendingTxWhereInput[]
    NOT?: PendingTxWhereInput | PendingTxWhereInput[]
    walletAddress?: StringFilter<"PendingTx"> | string
    operationType?: StringFilter<"PendingTx"> | string
    coinId?: StringNullableFilter<"PendingTx"> | string | null
    status?: EnumTxStatusFilter<"PendingTx"> | $Enums.TxStatus
    serializedTx?: BytesNullableFilter<"PendingTx"> | Bytes | null
    blockhash?: StringNullableFilter<"PendingTx"> | string | null
    lastValidBlockHeight?: BigIntNullableFilter<"PendingTx"> | bigint | number | null
    confirmedSlot?: BigIntNullableFilter<"PendingTx"> | bigint | number | null
    finalizedAt?: DateTimeNullableFilter<"PendingTx"> | Date | string | null
    errorMessage?: StringNullableFilter<"PendingTx"> | string | null
    errorCode?: StringNullableFilter<"PendingTx"> | string | null
    canResubmit?: BoolFilter<"PendingTx"> | boolean
    submitAttempts?: IntFilter<"PendingTx"> | number
    lastSubmittedAt?: DateTimeNullableFilter<"PendingTx"> | Date | string | null
    expiresAt?: DateTimeNullableFilter<"PendingTx"> | Date | string | null
    createdAt?: DateTimeFilter<"PendingTx"> | Date | string
    updatedAt?: DateTimeFilter<"PendingTx"> | Date | string
  }, "id" | "idempotencyKey" | "signature">

  export type PendingTxOrderByWithAggregationInput = {
    id?: SortOrder
    idempotencyKey?: SortOrder
    walletAddress?: SortOrder
    operationType?: SortOrder
    coinId?: SortOrderInput | SortOrder
    status?: SortOrder
    serializedTx?: SortOrderInput | SortOrder
    signature?: SortOrderInput | SortOrder
    blockhash?: SortOrderInput | SortOrder
    lastValidBlockHeight?: SortOrderInput | SortOrder
    confirmedSlot?: SortOrderInput | SortOrder
    finalizedAt?: SortOrderInput | SortOrder
    errorMessage?: SortOrderInput | SortOrder
    errorCode?: SortOrderInput | SortOrder
    canResubmit?: SortOrder
    submitAttempts?: SortOrder
    lastSubmittedAt?: SortOrderInput | SortOrder
    expiresAt?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PendingTxCountOrderByAggregateInput
    _avg?: PendingTxAvgOrderByAggregateInput
    _max?: PendingTxMaxOrderByAggregateInput
    _min?: PendingTxMinOrderByAggregateInput
    _sum?: PendingTxSumOrderByAggregateInput
  }

  export type PendingTxScalarWhereWithAggregatesInput = {
    AND?: PendingTxScalarWhereWithAggregatesInput | PendingTxScalarWhereWithAggregatesInput[]
    OR?: PendingTxScalarWhereWithAggregatesInput[]
    NOT?: PendingTxScalarWhereWithAggregatesInput | PendingTxScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PendingTx"> | string
    idempotencyKey?: StringWithAggregatesFilter<"PendingTx"> | string
    walletAddress?: StringWithAggregatesFilter<"PendingTx"> | string
    operationType?: StringWithAggregatesFilter<"PendingTx"> | string
    coinId?: StringNullableWithAggregatesFilter<"PendingTx"> | string | null
    status?: EnumTxStatusWithAggregatesFilter<"PendingTx"> | $Enums.TxStatus
    serializedTx?: BytesNullableWithAggregatesFilter<"PendingTx"> | Bytes | null
    signature?: StringNullableWithAggregatesFilter<"PendingTx"> | string | null
    blockhash?: StringNullableWithAggregatesFilter<"PendingTx"> | string | null
    lastValidBlockHeight?: BigIntNullableWithAggregatesFilter<"PendingTx"> | bigint | number | null
    confirmedSlot?: BigIntNullableWithAggregatesFilter<"PendingTx"> | bigint | number | null
    finalizedAt?: DateTimeNullableWithAggregatesFilter<"PendingTx"> | Date | string | null
    errorMessage?: StringNullableWithAggregatesFilter<"PendingTx"> | string | null
    errorCode?: StringNullableWithAggregatesFilter<"PendingTx"> | string | null
    canResubmit?: BoolWithAggregatesFilter<"PendingTx"> | boolean
    submitAttempts?: IntWithAggregatesFilter<"PendingTx"> | number
    lastSubmittedAt?: DateTimeNullableWithAggregatesFilter<"PendingTx"> | Date | string | null
    expiresAt?: DateTimeNullableWithAggregatesFilter<"PendingTx"> | Date | string | null
    createdAt?: DateTimeWithAggregatesFilter<"PendingTx"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PendingTx"> | Date | string
  }

  export type PushSubscriptionWhereInput = {
    AND?: PushSubscriptionWhereInput | PushSubscriptionWhereInput[]
    OR?: PushSubscriptionWhereInput[]
    NOT?: PushSubscriptionWhereInput | PushSubscriptionWhereInput[]
    id?: StringFilter<"PushSubscription"> | string
    walletAddress?: StringFilter<"PushSubscription"> | string
    platform?: StringFilter<"PushSubscription"> | string
    token?: StringFilter<"PushSubscription"> | string
    isActive?: BoolFilter<"PushSubscription"> | boolean
    createdAt?: DateTimeFilter<"PushSubscription"> | Date | string
    updatedAt?: DateTimeFilter<"PushSubscription"> | Date | string
  }

  export type PushSubscriptionOrderByWithRelationInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    platform?: SortOrder
    token?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PushSubscriptionWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    walletAddress_token?: PushSubscriptionWalletAddressTokenCompoundUniqueInput
    AND?: PushSubscriptionWhereInput | PushSubscriptionWhereInput[]
    OR?: PushSubscriptionWhereInput[]
    NOT?: PushSubscriptionWhereInput | PushSubscriptionWhereInput[]
    walletAddress?: StringFilter<"PushSubscription"> | string
    platform?: StringFilter<"PushSubscription"> | string
    token?: StringFilter<"PushSubscription"> | string
    isActive?: BoolFilter<"PushSubscription"> | boolean
    createdAt?: DateTimeFilter<"PushSubscription"> | Date | string
    updatedAt?: DateTimeFilter<"PushSubscription"> | Date | string
  }, "id" | "walletAddress_token">

  export type PushSubscriptionOrderByWithAggregationInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    platform?: SortOrder
    token?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: PushSubscriptionCountOrderByAggregateInput
    _max?: PushSubscriptionMaxOrderByAggregateInput
    _min?: PushSubscriptionMinOrderByAggregateInput
  }

  export type PushSubscriptionScalarWhereWithAggregatesInput = {
    AND?: PushSubscriptionScalarWhereWithAggregatesInput | PushSubscriptionScalarWhereWithAggregatesInput[]
    OR?: PushSubscriptionScalarWhereWithAggregatesInput[]
    NOT?: PushSubscriptionScalarWhereWithAggregatesInput | PushSubscriptionScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"PushSubscription"> | string
    walletAddress?: StringWithAggregatesFilter<"PushSubscription"> | string
    platform?: StringWithAggregatesFilter<"PushSubscription"> | string
    token?: StringWithAggregatesFilter<"PushSubscription"> | string
    isActive?: BoolWithAggregatesFilter<"PushSubscription"> | boolean
    createdAt?: DateTimeWithAggregatesFilter<"PushSubscription"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"PushSubscription"> | Date | string
  }

  export type DepositWhereInput = {
    AND?: DepositWhereInput | DepositWhereInput[]
    OR?: DepositWhereInput[]
    NOT?: DepositWhereInput | DepositWhereInput[]
    id?: StringFilter<"Deposit"> | string
    walletAddress?: StringFilter<"Deposit"> | string
    txSignature?: StringFilter<"Deposit"> | string
    amountSol?: DecimalFilter<"Deposit"> | Decimal | DecimalJsLike | number | string
    status?: StringFilter<"Deposit"> | string
    createdAt?: DateTimeFilter<"Deposit"> | Date | string
  }

  export type DepositOrderByWithRelationInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    txSignature?: SortOrder
    amountSol?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type DepositWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    txSignature?: string
    AND?: DepositWhereInput | DepositWhereInput[]
    OR?: DepositWhereInput[]
    NOT?: DepositWhereInput | DepositWhereInput[]
    walletAddress?: StringFilter<"Deposit"> | string
    amountSol?: DecimalFilter<"Deposit"> | Decimal | DecimalJsLike | number | string
    status?: StringFilter<"Deposit"> | string
    createdAt?: DateTimeFilter<"Deposit"> | Date | string
  }, "id" | "txSignature">

  export type DepositOrderByWithAggregationInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    txSignature?: SortOrder
    amountSol?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
    _count?: DepositCountOrderByAggregateInput
    _avg?: DepositAvgOrderByAggregateInput
    _max?: DepositMaxOrderByAggregateInput
    _min?: DepositMinOrderByAggregateInput
    _sum?: DepositSumOrderByAggregateInput
  }

  export type DepositScalarWhereWithAggregatesInput = {
    AND?: DepositScalarWhereWithAggregatesInput | DepositScalarWhereWithAggregatesInput[]
    OR?: DepositScalarWhereWithAggregatesInput[]
    NOT?: DepositScalarWhereWithAggregatesInput | DepositScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Deposit"> | string
    walletAddress?: StringWithAggregatesFilter<"Deposit"> | string
    txSignature?: StringWithAggregatesFilter<"Deposit"> | string
    amountSol?: DecimalWithAggregatesFilter<"Deposit"> | Decimal | DecimalJsLike | number | string
    status?: StringWithAggregatesFilter<"Deposit"> | string
    createdAt?: DateTimeWithAggregatesFilter<"Deposit"> | Date | string
  }

  export type DepositScanWhereInput = {
    AND?: DepositScanWhereInput | DepositScanWhereInput[]
    OR?: DepositScanWhereInput[]
    NOT?: DepositScanWhereInput | DepositScanWhereInput[]
    walletAddress?: StringFilter<"DepositScan"> | string
    lastSignature?: StringNullableFilter<"DepositScan"> | string | null
    updatedAt?: DateTimeFilter<"DepositScan"> | Date | string
  }

  export type DepositScanOrderByWithRelationInput = {
    walletAddress?: SortOrder
    lastSignature?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
  }

  export type DepositScanWhereUniqueInput = Prisma.AtLeast<{
    walletAddress?: string
    AND?: DepositScanWhereInput | DepositScanWhereInput[]
    OR?: DepositScanWhereInput[]
    NOT?: DepositScanWhereInput | DepositScanWhereInput[]
    lastSignature?: StringNullableFilter<"DepositScan"> | string | null
    updatedAt?: DateTimeFilter<"DepositScan"> | Date | string
  }, "walletAddress">

  export type DepositScanOrderByWithAggregationInput = {
    walletAddress?: SortOrder
    lastSignature?: SortOrderInput | SortOrder
    updatedAt?: SortOrder
    _count?: DepositScanCountOrderByAggregateInput
    _max?: DepositScanMaxOrderByAggregateInput
    _min?: DepositScanMinOrderByAggregateInput
  }

  export type DepositScanScalarWhereWithAggregatesInput = {
    AND?: DepositScanScalarWhereWithAggregatesInput | DepositScanScalarWhereWithAggregatesInput[]
    OR?: DepositScanScalarWhereWithAggregatesInput[]
    NOT?: DepositScanScalarWhereWithAggregatesInput | DepositScanScalarWhereWithAggregatesInput[]
    walletAddress?: StringWithAggregatesFilter<"DepositScan"> | string
    lastSignature?: StringNullableWithAggregatesFilter<"DepositScan"> | string | null
    updatedAt?: DateTimeWithAggregatesFilter<"DepositScan"> | Date | string
  }

  export type WithdrawalWhereInput = {
    AND?: WithdrawalWhereInput | WithdrawalWhereInput[]
    OR?: WithdrawalWhereInput[]
    NOT?: WithdrawalWhereInput | WithdrawalWhereInput[]
    id?: StringFilter<"Withdrawal"> | string
    walletAddress?: StringFilter<"Withdrawal"> | string
    destination?: StringFilter<"Withdrawal"> | string
    amountSol?: DecimalFilter<"Withdrawal"> | Decimal | DecimalJsLike | number | string
    txSignature?: StringNullableFilter<"Withdrawal"> | string | null
    status?: StringFilter<"Withdrawal"> | string
    idempotencyKey?: StringNullableFilter<"Withdrawal"> | string | null
    createdAt?: DateTimeFilter<"Withdrawal"> | Date | string
  }

  export type WithdrawalOrderByWithRelationInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    destination?: SortOrder
    amountSol?: SortOrder
    txSignature?: SortOrderInput | SortOrder
    status?: SortOrder
    idempotencyKey?: SortOrderInput | SortOrder
    createdAt?: SortOrder
  }

  export type WithdrawalWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    idempotencyKey?: string
    AND?: WithdrawalWhereInput | WithdrawalWhereInput[]
    OR?: WithdrawalWhereInput[]
    NOT?: WithdrawalWhereInput | WithdrawalWhereInput[]
    walletAddress?: StringFilter<"Withdrawal"> | string
    destination?: StringFilter<"Withdrawal"> | string
    amountSol?: DecimalFilter<"Withdrawal"> | Decimal | DecimalJsLike | number | string
    txSignature?: StringNullableFilter<"Withdrawal"> | string | null
    status?: StringFilter<"Withdrawal"> | string
    createdAt?: DateTimeFilter<"Withdrawal"> | Date | string
  }, "id" | "idempotencyKey">

  export type WithdrawalOrderByWithAggregationInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    destination?: SortOrder
    amountSol?: SortOrder
    txSignature?: SortOrderInput | SortOrder
    status?: SortOrder
    idempotencyKey?: SortOrderInput | SortOrder
    createdAt?: SortOrder
    _count?: WithdrawalCountOrderByAggregateInput
    _avg?: WithdrawalAvgOrderByAggregateInput
    _max?: WithdrawalMaxOrderByAggregateInput
    _min?: WithdrawalMinOrderByAggregateInput
    _sum?: WithdrawalSumOrderByAggregateInput
  }

  export type WithdrawalScalarWhereWithAggregatesInput = {
    AND?: WithdrawalScalarWhereWithAggregatesInput | WithdrawalScalarWhereWithAggregatesInput[]
    OR?: WithdrawalScalarWhereWithAggregatesInput[]
    NOT?: WithdrawalScalarWhereWithAggregatesInput | WithdrawalScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"Withdrawal"> | string
    walletAddress?: StringWithAggregatesFilter<"Withdrawal"> | string
    destination?: StringWithAggregatesFilter<"Withdrawal"> | string
    amountSol?: DecimalWithAggregatesFilter<"Withdrawal"> | Decimal | DecimalJsLike | number | string
    txSignature?: StringNullableWithAggregatesFilter<"Withdrawal"> | string | null
    status?: StringWithAggregatesFilter<"Withdrawal"> | string
    idempotencyKey?: StringNullableWithAggregatesFilter<"Withdrawal"> | string | null
    createdAt?: DateTimeWithAggregatesFilter<"Withdrawal"> | Date | string
  }

  export type ProfileCreateInput = {
    id?: string
    walletAddress: string
    privyUserId: string
    role?: $Enums.UserRole
    referrerWallet?: string | null
    encryptedMnemonic?: string | null
    mnemonicIv?: string | null
    mnemonicTag?: string | null
    isBanned?: boolean
    runBalanceSol?: Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: Decimal | DecimalJsLike | number | string
    referralRewardsSol?: Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSeenAt?: Date | string | null
    coins?: CoinCreateNestedManyWithoutCreatorInput
    transactions?: TransactionCreateNestedManyWithoutProfileInput
    holdings?: HoldingCreateNestedManyWithoutProfileInput
  }

  export type ProfileUncheckedCreateInput = {
    id?: string
    walletAddress: string
    privyUserId: string
    role?: $Enums.UserRole
    referrerWallet?: string | null
    encryptedMnemonic?: string | null
    mnemonicIv?: string | null
    mnemonicTag?: string | null
    isBanned?: boolean
    runBalanceSol?: Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: Decimal | DecimalJsLike | number | string
    referralRewardsSol?: Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSeenAt?: Date | string | null
    coins?: CoinUncheckedCreateNestedManyWithoutCreatorInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutProfileInput
    holdings?: HoldingUncheckedCreateNestedManyWithoutProfileInput
  }

  export type ProfileUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    privyUserId?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    encryptedMnemonic?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicIv?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicTag?: NullableStringFieldUpdateOperationsInput | string | null
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    runBalanceSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referralRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    coins?: CoinUpdateManyWithoutCreatorNestedInput
    transactions?: TransactionUpdateManyWithoutProfileNestedInput
    holdings?: HoldingUpdateManyWithoutProfileNestedInput
  }

  export type ProfileUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    privyUserId?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    encryptedMnemonic?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicIv?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicTag?: NullableStringFieldUpdateOperationsInput | string | null
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    runBalanceSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referralRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    coins?: CoinUncheckedUpdateManyWithoutCreatorNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutProfileNestedInput
    holdings?: HoldingUncheckedUpdateManyWithoutProfileNestedInput
  }

  export type ProfileCreateManyInput = {
    id?: string
    walletAddress: string
    privyUserId: string
    role?: $Enums.UserRole
    referrerWallet?: string | null
    encryptedMnemonic?: string | null
    mnemonicIv?: string | null
    mnemonicTag?: string | null
    isBanned?: boolean
    runBalanceSol?: Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: Decimal | DecimalJsLike | number | string
    referralRewardsSol?: Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSeenAt?: Date | string | null
  }

  export type ProfileUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    privyUserId?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    encryptedMnemonic?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicIv?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicTag?: NullableStringFieldUpdateOperationsInput | string | null
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    runBalanceSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referralRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type ProfileUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    privyUserId?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    encryptedMnemonic?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicIv?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicTag?: NullableStringFieldUpdateOperationsInput | string | null
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    runBalanceSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referralRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type CoinCreateInput = {
    id?: string
    mintAddress: string
    name: string
    symbol: string
    description: string
    imageUri: string
    metadataUri?: string | null
    status?: $Enums.CoinStatus
    version?: number
    virtualSolReserves: Decimal | DecimalJsLike | number | string
    virtualTokenReserves: Decimal | DecimalJsLike | number | string
    realSolReserves?: Decimal | DecimalJsLike | number | string
    realTokenReserves: Decimal | DecimalJsLike | number | string
    totalFeesCollected?: Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerWallet?: string | null
    graduationInitiatedAt?: Date | string | null
    graduationCompletedAt?: Date | string | null
    raydiumPoolAddress?: string | null
    lpMintAddress?: string | null
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    creator: ProfileCreateNestedOneWithoutCoinsInput
    transactions?: TransactionCreateNestedManyWithoutCoinInput
    holdings?: HoldingCreateNestedManyWithoutCoinInput
    candles?: CandleCreateNestedManyWithoutCoinInput
  }

  export type CoinUncheckedCreateInput = {
    id?: string
    mintAddress: string
    creatorWallet: string
    name: string
    symbol: string
    description: string
    imageUri: string
    metadataUri?: string | null
    status?: $Enums.CoinStatus
    version?: number
    virtualSolReserves: Decimal | DecimalJsLike | number | string
    virtualTokenReserves: Decimal | DecimalJsLike | number | string
    realSolReserves?: Decimal | DecimalJsLike | number | string
    realTokenReserves: Decimal | DecimalJsLike | number | string
    totalFeesCollected?: Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerWallet?: string | null
    graduationInitiatedAt?: Date | string | null
    graduationCompletedAt?: Date | string | null
    raydiumPoolAddress?: string | null
    lpMintAddress?: string | null
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutCoinInput
    holdings?: HoldingUncheckedCreateNestedManyWithoutCoinInput
    candles?: CandleUncheckedCreateNestedManyWithoutCoinInput
  }

  export type CoinUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    mintAddress?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    imageUri?: StringFieldUpdateOperationsInput | string
    metadataUri?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCoinStatusFieldUpdateOperationsInput | $Enums.CoinStatus
    version?: IntFieldUpdateOperationsInput | number
    virtualSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    graduationInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    graduationCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    raydiumPoolAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpMintAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpTokensBurned?: BoolFieldUpdateOperationsInput | boolean
    mintAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    freezeAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: ProfileUpdateOneRequiredWithoutCoinsNestedInput
    transactions?: TransactionUpdateManyWithoutCoinNestedInput
    holdings?: HoldingUpdateManyWithoutCoinNestedInput
    candles?: CandleUpdateManyWithoutCoinNestedInput
  }

  export type CoinUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    mintAddress?: StringFieldUpdateOperationsInput | string
    creatorWallet?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    imageUri?: StringFieldUpdateOperationsInput | string
    metadataUri?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCoinStatusFieldUpdateOperationsInput | $Enums.CoinStatus
    version?: IntFieldUpdateOperationsInput | number
    virtualSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    graduationInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    graduationCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    raydiumPoolAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpMintAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpTokensBurned?: BoolFieldUpdateOperationsInput | boolean
    mintAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    freezeAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutCoinNestedInput
    holdings?: HoldingUncheckedUpdateManyWithoutCoinNestedInput
    candles?: CandleUncheckedUpdateManyWithoutCoinNestedInput
  }

  export type CoinCreateManyInput = {
    id?: string
    mintAddress: string
    creatorWallet: string
    name: string
    symbol: string
    description: string
    imageUri: string
    metadataUri?: string | null
    status?: $Enums.CoinStatus
    version?: number
    virtualSolReserves: Decimal | DecimalJsLike | number | string
    virtualTokenReserves: Decimal | DecimalJsLike | number | string
    realSolReserves?: Decimal | DecimalJsLike | number | string
    realTokenReserves: Decimal | DecimalJsLike | number | string
    totalFeesCollected?: Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerWallet?: string | null
    graduationInitiatedAt?: Date | string | null
    graduationCompletedAt?: Date | string | null
    raydiumPoolAddress?: string | null
    lpMintAddress?: string | null
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type CoinUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    mintAddress?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    imageUri?: StringFieldUpdateOperationsInput | string
    metadataUri?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCoinStatusFieldUpdateOperationsInput | $Enums.CoinStatus
    version?: IntFieldUpdateOperationsInput | number
    virtualSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    graduationInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    graduationCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    raydiumPoolAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpMintAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpTokensBurned?: BoolFieldUpdateOperationsInput | boolean
    mintAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    freezeAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CoinUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    mintAddress?: StringFieldUpdateOperationsInput | string
    creatorWallet?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    imageUri?: StringFieldUpdateOperationsInput | string
    metadataUri?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCoinStatusFieldUpdateOperationsInput | $Enums.CoinStatus
    version?: IntFieldUpdateOperationsInput | number
    virtualSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    graduationInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    graduationCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    raydiumPoolAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpMintAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpTokensBurned?: BoolFieldUpdateOperationsInput | boolean
    mintAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    freezeAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HoldingCreateInput = {
    id?: string
    tokenBalance: Decimal | DecimalJsLike | number | string
    costBasisSol?: Decimal | DecimalJsLike | number | string
    totalBought?: Decimal | DecimalJsLike | number | string
    totalSold?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
    profile: ProfileCreateNestedOneWithoutHoldingsInput
    coin: CoinCreateNestedOneWithoutHoldingsInput
  }

  export type HoldingUncheckedCreateInput = {
    id?: string
    walletAddress: string
    coinId: string
    tokenBalance: Decimal | DecimalJsLike | number | string
    costBasisSol?: Decimal | DecimalJsLike | number | string
    totalBought?: Decimal | DecimalJsLike | number | string
    totalSold?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type HoldingUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tokenBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    costBasisSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalBought?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalSold?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profile?: ProfileUpdateOneRequiredWithoutHoldingsNestedInput
    coin?: CoinUpdateOneRequiredWithoutHoldingsNestedInput
  }

  export type HoldingUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    coinId?: StringFieldUpdateOperationsInput | string
    tokenBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    costBasisSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalBought?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalSold?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HoldingCreateManyInput = {
    id?: string
    walletAddress: string
    coinId: string
    tokenBalance: Decimal | DecimalJsLike | number | string
    costBasisSol?: Decimal | DecimalJsLike | number | string
    totalBought?: Decimal | DecimalJsLike | number | string
    totalSold?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type HoldingUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tokenBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    costBasisSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalBought?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalSold?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HoldingUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    coinId?: StringFieldUpdateOperationsInput | string
    tokenBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    costBasisSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalBought?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalSold?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionCreateInput = {
    id?: string
    tradeType: $Enums.TradeType
    txSignature: string
    slot: bigint | number
    solAmount: Decimal | DecimalJsLike | number | string
    tokenAmount: Decimal | DecimalJsLike | number | string
    pricePerToken: Decimal | DecimalJsLike | number | string
    totalFee: Decimal | DecimalJsLike | number | string
    creatorFee: Decimal | DecimalJsLike | number | string
    referrerFee?: Decimal | DecimalJsLike | number | string
    treasuryFee: Decimal | DecimalJsLike | number | string
    virtualSolAfter: Decimal | DecimalJsLike | number | string
    virtualTokensAfter: Decimal | DecimalJsLike | number | string
    confirmedAt: Date | string
    createdAt?: Date | string
    coin: CoinCreateNestedOneWithoutTransactionsInput
    profile: ProfileCreateNestedOneWithoutTransactionsInput
  }

  export type TransactionUncheckedCreateInput = {
    id?: string
    coinId: string
    walletAddress: string
    tradeType: $Enums.TradeType
    txSignature: string
    slot: bigint | number
    solAmount: Decimal | DecimalJsLike | number | string
    tokenAmount: Decimal | DecimalJsLike | number | string
    pricePerToken: Decimal | DecimalJsLike | number | string
    totalFee: Decimal | DecimalJsLike | number | string
    creatorFee: Decimal | DecimalJsLike | number | string
    referrerFee?: Decimal | DecimalJsLike | number | string
    treasuryFee: Decimal | DecimalJsLike | number | string
    virtualSolAfter: Decimal | DecimalJsLike | number | string
    virtualTokensAfter: Decimal | DecimalJsLike | number | string
    confirmedAt: Date | string
    createdAt?: Date | string
  }

  export type TransactionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tradeType?: EnumTradeTypeFieldUpdateOperationsInput | $Enums.TradeType
    txSignature?: StringFieldUpdateOperationsInput | string
    slot?: BigIntFieldUpdateOperationsInput | bigint | number
    solAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tokenAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    pricePerToken?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referrerFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    treasuryFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualSolAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokensAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    confirmedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    coin?: CoinUpdateOneRequiredWithoutTransactionsNestedInput
    profile?: ProfileUpdateOneRequiredWithoutTransactionsNestedInput
  }

  export type TransactionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    coinId?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    tradeType?: EnumTradeTypeFieldUpdateOperationsInput | $Enums.TradeType
    txSignature?: StringFieldUpdateOperationsInput | string
    slot?: BigIntFieldUpdateOperationsInput | bigint | number
    solAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tokenAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    pricePerToken?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referrerFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    treasuryFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualSolAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokensAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    confirmedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionCreateManyInput = {
    id?: string
    coinId: string
    walletAddress: string
    tradeType: $Enums.TradeType
    txSignature: string
    slot: bigint | number
    solAmount: Decimal | DecimalJsLike | number | string
    tokenAmount: Decimal | DecimalJsLike | number | string
    pricePerToken: Decimal | DecimalJsLike | number | string
    totalFee: Decimal | DecimalJsLike | number | string
    creatorFee: Decimal | DecimalJsLike | number | string
    referrerFee?: Decimal | DecimalJsLike | number | string
    treasuryFee: Decimal | DecimalJsLike | number | string
    virtualSolAfter: Decimal | DecimalJsLike | number | string
    virtualTokensAfter: Decimal | DecimalJsLike | number | string
    confirmedAt: Date | string
    createdAt?: Date | string
  }

  export type TransactionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tradeType?: EnumTradeTypeFieldUpdateOperationsInput | $Enums.TradeType
    txSignature?: StringFieldUpdateOperationsInput | string
    slot?: BigIntFieldUpdateOperationsInput | bigint | number
    solAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tokenAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    pricePerToken?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referrerFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    treasuryFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualSolAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokensAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    confirmedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    coinId?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    tradeType?: EnumTradeTypeFieldUpdateOperationsInput | $Enums.TradeType
    txSignature?: StringFieldUpdateOperationsInput | string
    slot?: BigIntFieldUpdateOperationsInput | bigint | number
    solAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tokenAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    pricePerToken?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referrerFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    treasuryFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualSolAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokensAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    confirmedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CandleCreateInput = {
    id?: string
    timeframe: $Enums.Timeframe
    openTime: bigint | number
    open: Decimal | DecimalJsLike | number | string
    high: Decimal | DecimalJsLike | number | string
    low: Decimal | DecimalJsLike | number | string
    close: Decimal | DecimalJsLike | number | string
    volume: Decimal | DecimalJsLike | number | string
    trades?: number
    updatedAt?: Date | string
    coin: CoinCreateNestedOneWithoutCandlesInput
  }

  export type CandleUncheckedCreateInput = {
    id?: string
    coinId: string
    timeframe: $Enums.Timeframe
    openTime: bigint | number
    open: Decimal | DecimalJsLike | number | string
    high: Decimal | DecimalJsLike | number | string
    low: Decimal | DecimalJsLike | number | string
    close: Decimal | DecimalJsLike | number | string
    volume: Decimal | DecimalJsLike | number | string
    trades?: number
    updatedAt?: Date | string
  }

  export type CandleUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    timeframe?: EnumTimeframeFieldUpdateOperationsInput | $Enums.Timeframe
    openTime?: BigIntFieldUpdateOperationsInput | bigint | number
    open?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    high?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    low?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    close?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    volume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    trades?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    coin?: CoinUpdateOneRequiredWithoutCandlesNestedInput
  }

  export type CandleUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    coinId?: StringFieldUpdateOperationsInput | string
    timeframe?: EnumTimeframeFieldUpdateOperationsInput | $Enums.Timeframe
    openTime?: BigIntFieldUpdateOperationsInput | bigint | number
    open?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    high?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    low?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    close?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    volume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    trades?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CandleCreateManyInput = {
    id?: string
    coinId: string
    timeframe: $Enums.Timeframe
    openTime: bigint | number
    open: Decimal | DecimalJsLike | number | string
    high: Decimal | DecimalJsLike | number | string
    low: Decimal | DecimalJsLike | number | string
    close: Decimal | DecimalJsLike | number | string
    volume: Decimal | DecimalJsLike | number | string
    trades?: number
    updatedAt?: Date | string
  }

  export type CandleUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    timeframe?: EnumTimeframeFieldUpdateOperationsInput | $Enums.Timeframe
    openTime?: BigIntFieldUpdateOperationsInput | bigint | number
    open?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    high?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    low?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    close?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    volume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    trades?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CandleUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    coinId?: StringFieldUpdateOperationsInput | string
    timeframe?: EnumTimeframeFieldUpdateOperationsInput | $Enums.Timeframe
    openTime?: BigIntFieldUpdateOperationsInput | bigint | number
    open?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    high?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    low?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    close?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    volume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    trades?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralAccountCreateInput = {
    id?: string
    walletAddress: string
    totalFeesEarned?: Decimal | DecimalJsLike | number | string
    totalFeesClaimed?: Decimal | DecimalJsLike | number | string
    pendingFees?: Decimal | DecimalJsLike | number | string
    referralCount?: number
    lastClaimedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralAccountUncheckedCreateInput = {
    id?: string
    walletAddress: string
    totalFeesEarned?: Decimal | DecimalJsLike | number | string
    totalFeesClaimed?: Decimal | DecimalJsLike | number | string
    pendingFees?: Decimal | DecimalJsLike | number | string
    referralCount?: number
    lastClaimedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralAccountUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    totalFeesEarned?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesClaimed?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    pendingFees?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referralCount?: IntFieldUpdateOperationsInput | number
    lastClaimedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralAccountUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    totalFeesEarned?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesClaimed?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    pendingFees?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referralCount?: IntFieldUpdateOperationsInput | number
    lastClaimedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralAccountCreateManyInput = {
    id?: string
    walletAddress: string
    totalFeesEarned?: Decimal | DecimalJsLike | number | string
    totalFeesClaimed?: Decimal | DecimalJsLike | number | string
    pendingFees?: Decimal | DecimalJsLike | number | string
    referralCount?: number
    lastClaimedAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type ReferralAccountUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    totalFeesEarned?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesClaimed?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    pendingFees?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referralCount?: IntFieldUpdateOperationsInput | number
    lastClaimedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type ReferralAccountUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    totalFeesEarned?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesClaimed?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    pendingFees?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referralCount?: IntFieldUpdateOperationsInput | number
    lastClaimedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TreasuryEventCreateInput = {
    id?: string
    eventType: string
    coinId?: string | null
    txSignature?: string | null
    amountLamports: Decimal | DecimalJsLike | number | string
    cumulativeTotal: Decimal | DecimalJsLike | number | string
    memo?: string | null
    createdAt?: Date | string
  }

  export type TreasuryEventUncheckedCreateInput = {
    id?: string
    eventType: string
    coinId?: string | null
    txSignature?: string | null
    amountLamports: Decimal | DecimalJsLike | number | string
    cumulativeTotal: Decimal | DecimalJsLike | number | string
    memo?: string | null
    createdAt?: Date | string
  }

  export type TreasuryEventUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    coinId?: NullableStringFieldUpdateOperationsInput | string | null
    txSignature?: NullableStringFieldUpdateOperationsInput | string | null
    amountLamports?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    cumulativeTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    memo?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TreasuryEventUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    coinId?: NullableStringFieldUpdateOperationsInput | string | null
    txSignature?: NullableStringFieldUpdateOperationsInput | string | null
    amountLamports?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    cumulativeTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    memo?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TreasuryEventCreateManyInput = {
    id?: string
    eventType: string
    coinId?: string | null
    txSignature?: string | null
    amountLamports: Decimal | DecimalJsLike | number | string
    cumulativeTotal: Decimal | DecimalJsLike | number | string
    memo?: string | null
    createdAt?: Date | string
  }

  export type TreasuryEventUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    coinId?: NullableStringFieldUpdateOperationsInput | string | null
    txSignature?: NullableStringFieldUpdateOperationsInput | string | null
    amountLamports?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    cumulativeTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    memo?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TreasuryEventUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    eventType?: StringFieldUpdateOperationsInput | string
    coinId?: NullableStringFieldUpdateOperationsInput | string | null
    txSignature?: NullableStringFieldUpdateOperationsInput | string | null
    amountLamports?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    cumulativeTotal?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    memo?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogCreateInput = {
    id?: bigint | number
    action: $Enums.AuditAction
    actorWallet: string
    targetId?: string | null
    oldValue?: NullableJsonNullValueInput | InputJsonValue
    newValue?: NullableJsonNullValueInput | InputJsonValue
    txSignature?: string | null
    ipAddress?: string | null
    userAgent?: string | null
    createdAt?: Date | string
  }

  export type AuditLogUncheckedCreateInput = {
    id?: bigint | number
    action: $Enums.AuditAction
    actorWallet: string
    targetId?: string | null
    oldValue?: NullableJsonNullValueInput | InputJsonValue
    newValue?: NullableJsonNullValueInput | InputJsonValue
    txSignature?: string | null
    ipAddress?: string | null
    userAgent?: string | null
    createdAt?: Date | string
  }

  export type AuditLogUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    action?: EnumAuditActionFieldUpdateOperationsInput | $Enums.AuditAction
    actorWallet?: StringFieldUpdateOperationsInput | string
    targetId?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableJsonNullValueInput | InputJsonValue
    newValue?: NullableJsonNullValueInput | InputJsonValue
    txSignature?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogUncheckedUpdateInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    action?: EnumAuditActionFieldUpdateOperationsInput | $Enums.AuditAction
    actorWallet?: StringFieldUpdateOperationsInput | string
    targetId?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableJsonNullValueInput | InputJsonValue
    newValue?: NullableJsonNullValueInput | InputJsonValue
    txSignature?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogCreateManyInput = {
    id?: bigint | number
    action: $Enums.AuditAction
    actorWallet: string
    targetId?: string | null
    oldValue?: NullableJsonNullValueInput | InputJsonValue
    newValue?: NullableJsonNullValueInput | InputJsonValue
    txSignature?: string | null
    ipAddress?: string | null
    userAgent?: string | null
    createdAt?: Date | string
  }

  export type AuditLogUpdateManyMutationInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    action?: EnumAuditActionFieldUpdateOperationsInput | $Enums.AuditAction
    actorWallet?: StringFieldUpdateOperationsInput | string
    targetId?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableJsonNullValueInput | InputJsonValue
    newValue?: NullableJsonNullValueInput | InputJsonValue
    txSignature?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type AuditLogUncheckedUpdateManyInput = {
    id?: BigIntFieldUpdateOperationsInput | bigint | number
    action?: EnumAuditActionFieldUpdateOperationsInput | $Enums.AuditAction
    actorWallet?: StringFieldUpdateOperationsInput | string
    targetId?: NullableStringFieldUpdateOperationsInput | string | null
    oldValue?: NullableJsonNullValueInput | InputJsonValue
    newValue?: NullableJsonNullValueInput | InputJsonValue
    txSignature?: NullableStringFieldUpdateOperationsInput | string | null
    ipAddress?: NullableStringFieldUpdateOperationsInput | string | null
    userAgent?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IndexerStateCreateInput = {
    id: string
    lastSlot: bigint | number
    lastSignature?: string | null
    isHealthy?: boolean
    errorMessage?: string | null
    updatedAt?: Date | string
  }

  export type IndexerStateUncheckedCreateInput = {
    id: string
    lastSlot: bigint | number
    lastSignature?: string | null
    isHealthy?: boolean
    errorMessage?: string | null
    updatedAt?: Date | string
  }

  export type IndexerStateUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    lastSlot?: BigIntFieldUpdateOperationsInput | bigint | number
    lastSignature?: NullableStringFieldUpdateOperationsInput | string | null
    isHealthy?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IndexerStateUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    lastSlot?: BigIntFieldUpdateOperationsInput | bigint | number
    lastSignature?: NullableStringFieldUpdateOperationsInput | string | null
    isHealthy?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IndexerStateCreateManyInput = {
    id: string
    lastSlot: bigint | number
    lastSignature?: string | null
    isHealthy?: boolean
    errorMessage?: string | null
    updatedAt?: Date | string
  }

  export type IndexerStateUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    lastSlot?: BigIntFieldUpdateOperationsInput | bigint | number
    lastSignature?: NullableStringFieldUpdateOperationsInput | string | null
    isHealthy?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type IndexerStateUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    lastSlot?: BigIntFieldUpdateOperationsInput | bigint | number
    lastSignature?: NullableStringFieldUpdateOperationsInput | string | null
    isHealthy?: BoolFieldUpdateOperationsInput | boolean
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PendingTxCreateInput = {
    id?: string
    idempotencyKey: string
    walletAddress: string
    operationType: string
    coinId?: string | null
    status?: $Enums.TxStatus
    serializedTx?: Bytes | null
    signature?: string | null
    blockhash?: string | null
    lastValidBlockHeight?: bigint | number | null
    confirmedSlot?: bigint | number | null
    finalizedAt?: Date | string | null
    errorMessage?: string | null
    errorCode?: string | null
    canResubmit?: boolean
    submitAttempts?: number
    lastSubmittedAt?: Date | string | null
    expiresAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PendingTxUncheckedCreateInput = {
    id?: string
    idempotencyKey: string
    walletAddress: string
    operationType: string
    coinId?: string | null
    status?: $Enums.TxStatus
    serializedTx?: Bytes | null
    signature?: string | null
    blockhash?: string | null
    lastValidBlockHeight?: bigint | number | null
    confirmedSlot?: bigint | number | null
    finalizedAt?: Date | string | null
    errorMessage?: string | null
    errorCode?: string | null
    canResubmit?: boolean
    submitAttempts?: number
    lastSubmittedAt?: Date | string | null
    expiresAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PendingTxUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    operationType?: StringFieldUpdateOperationsInput | string
    coinId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumTxStatusFieldUpdateOperationsInput | $Enums.TxStatus
    serializedTx?: NullableBytesFieldUpdateOperationsInput | Bytes | null
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    blockhash?: NullableStringFieldUpdateOperationsInput | string | null
    lastValidBlockHeight?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    confirmedSlot?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    finalizedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    canResubmit?: BoolFieldUpdateOperationsInput | boolean
    submitAttempts?: IntFieldUpdateOperationsInput | number
    lastSubmittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PendingTxUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    operationType?: StringFieldUpdateOperationsInput | string
    coinId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumTxStatusFieldUpdateOperationsInput | $Enums.TxStatus
    serializedTx?: NullableBytesFieldUpdateOperationsInput | Bytes | null
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    blockhash?: NullableStringFieldUpdateOperationsInput | string | null
    lastValidBlockHeight?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    confirmedSlot?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    finalizedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    canResubmit?: BoolFieldUpdateOperationsInput | boolean
    submitAttempts?: IntFieldUpdateOperationsInput | number
    lastSubmittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PendingTxCreateManyInput = {
    id?: string
    idempotencyKey: string
    walletAddress: string
    operationType: string
    coinId?: string | null
    status?: $Enums.TxStatus
    serializedTx?: Bytes | null
    signature?: string | null
    blockhash?: string | null
    lastValidBlockHeight?: bigint | number | null
    confirmedSlot?: bigint | number | null
    finalizedAt?: Date | string | null
    errorMessage?: string | null
    errorCode?: string | null
    canResubmit?: boolean
    submitAttempts?: number
    lastSubmittedAt?: Date | string | null
    expiresAt?: Date | string | null
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PendingTxUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    operationType?: StringFieldUpdateOperationsInput | string
    coinId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumTxStatusFieldUpdateOperationsInput | $Enums.TxStatus
    serializedTx?: NullableBytesFieldUpdateOperationsInput | Bytes | null
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    blockhash?: NullableStringFieldUpdateOperationsInput | string | null
    lastValidBlockHeight?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    confirmedSlot?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    finalizedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    canResubmit?: BoolFieldUpdateOperationsInput | boolean
    submitAttempts?: IntFieldUpdateOperationsInput | number
    lastSubmittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PendingTxUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    idempotencyKey?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    operationType?: StringFieldUpdateOperationsInput | string
    coinId?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumTxStatusFieldUpdateOperationsInput | $Enums.TxStatus
    serializedTx?: NullableBytesFieldUpdateOperationsInput | Bytes | null
    signature?: NullableStringFieldUpdateOperationsInput | string | null
    blockhash?: NullableStringFieldUpdateOperationsInput | string | null
    lastValidBlockHeight?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    confirmedSlot?: NullableBigIntFieldUpdateOperationsInput | bigint | number | null
    finalizedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    errorMessage?: NullableStringFieldUpdateOperationsInput | string | null
    errorCode?: NullableStringFieldUpdateOperationsInput | string | null
    canResubmit?: BoolFieldUpdateOperationsInput | boolean
    submitAttempts?: IntFieldUpdateOperationsInput | number
    lastSubmittedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    expiresAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PushSubscriptionCreateInput = {
    id?: string
    walletAddress: string
    platform: string
    token: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PushSubscriptionUncheckedCreateInput = {
    id?: string
    walletAddress: string
    platform: string
    token: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PushSubscriptionUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    platform?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PushSubscriptionUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    platform?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PushSubscriptionCreateManyInput = {
    id?: string
    walletAddress: string
    platform: string
    token: string
    isActive?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type PushSubscriptionUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    platform?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type PushSubscriptionUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    platform?: StringFieldUpdateOperationsInput | string
    token?: StringFieldUpdateOperationsInput | string
    isActive?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DepositCreateInput = {
    id?: string
    walletAddress: string
    txSignature: string
    amountSol: Decimal | DecimalJsLike | number | string
    status?: string
    createdAt?: Date | string
  }

  export type DepositUncheckedCreateInput = {
    id?: string
    walletAddress: string
    txSignature: string
    amountSol: Decimal | DecimalJsLike | number | string
    status?: string
    createdAt?: Date | string
  }

  export type DepositUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    txSignature?: StringFieldUpdateOperationsInput | string
    amountSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DepositUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    txSignature?: StringFieldUpdateOperationsInput | string
    amountSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DepositCreateManyInput = {
    id?: string
    walletAddress: string
    txSignature: string
    amountSol: Decimal | DecimalJsLike | number | string
    status?: string
    createdAt?: Date | string
  }

  export type DepositUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    txSignature?: StringFieldUpdateOperationsInput | string
    amountSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DepositUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    txSignature?: StringFieldUpdateOperationsInput | string
    amountSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DepositScanCreateInput = {
    walletAddress: string
    lastSignature?: string | null
    updatedAt?: Date | string
  }

  export type DepositScanUncheckedCreateInput = {
    walletAddress: string
    lastSignature?: string | null
    updatedAt?: Date | string
  }

  export type DepositScanUpdateInput = {
    walletAddress?: StringFieldUpdateOperationsInput | string
    lastSignature?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DepositScanUncheckedUpdateInput = {
    walletAddress?: StringFieldUpdateOperationsInput | string
    lastSignature?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DepositScanCreateManyInput = {
    walletAddress: string
    lastSignature?: string | null
    updatedAt?: Date | string
  }

  export type DepositScanUpdateManyMutationInput = {
    walletAddress?: StringFieldUpdateOperationsInput | string
    lastSignature?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type DepositScanUncheckedUpdateManyInput = {
    walletAddress?: StringFieldUpdateOperationsInput | string
    lastSignature?: NullableStringFieldUpdateOperationsInput | string | null
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WithdrawalCreateInput = {
    id?: string
    walletAddress: string
    destination: string
    amountSol: Decimal | DecimalJsLike | number | string
    txSignature?: string | null
    status?: string
    idempotencyKey?: string | null
    createdAt?: Date | string
  }

  export type WithdrawalUncheckedCreateInput = {
    id?: string
    walletAddress: string
    destination: string
    amountSol: Decimal | DecimalJsLike | number | string
    txSignature?: string | null
    status?: string
    idempotencyKey?: string | null
    createdAt?: Date | string
  }

  export type WithdrawalUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    destination?: StringFieldUpdateOperationsInput | string
    amountSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    txSignature?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WithdrawalUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    destination?: StringFieldUpdateOperationsInput | string
    amountSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    txSignature?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WithdrawalCreateManyInput = {
    id?: string
    walletAddress: string
    destination: string
    amountSol: Decimal | DecimalJsLike | number | string
    txSignature?: string | null
    status?: string
    idempotencyKey?: string | null
    createdAt?: Date | string
  }

  export type WithdrawalUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    destination?: StringFieldUpdateOperationsInput | string
    amountSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    txSignature?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type WithdrawalUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    destination?: StringFieldUpdateOperationsInput | string
    amountSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    txSignature?: NullableStringFieldUpdateOperationsInput | string | null
    status?: StringFieldUpdateOperationsInput | string
    idempotencyKey?: NullableStringFieldUpdateOperationsInput | string | null
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type CoinListRelationFilter = {
    every?: CoinWhereInput
    some?: CoinWhereInput
    none?: CoinWhereInput
  }

  export type TransactionListRelationFilter = {
    every?: TransactionWhereInput
    some?: TransactionWhereInput
    none?: TransactionWhereInput
  }

  export type HoldingListRelationFilter = {
    every?: HoldingWhereInput
    some?: HoldingWhereInput
    none?: HoldingWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type CoinOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type TransactionOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type HoldingOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type ProfileCountOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    privyUserId?: SortOrder
    role?: SortOrder
    referrerWallet?: SortOrder
    encryptedMnemonic?: SortOrder
    mnemonicIv?: SortOrder
    mnemonicTag?: SortOrder
    isBanned?: SortOrder
    runBalanceSol?: SortOrder
    creatorRewardsSol?: SortOrder
    referralRewardsSol?: SortOrder
    ownerRewardsSol?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastSeenAt?: SortOrder
  }

  export type ProfileAvgOrderByAggregateInput = {
    runBalanceSol?: SortOrder
    creatorRewardsSol?: SortOrder
    referralRewardsSol?: SortOrder
    ownerRewardsSol?: SortOrder
  }

  export type ProfileMaxOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    privyUserId?: SortOrder
    role?: SortOrder
    referrerWallet?: SortOrder
    encryptedMnemonic?: SortOrder
    mnemonicIv?: SortOrder
    mnemonicTag?: SortOrder
    isBanned?: SortOrder
    runBalanceSol?: SortOrder
    creatorRewardsSol?: SortOrder
    referralRewardsSol?: SortOrder
    ownerRewardsSol?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastSeenAt?: SortOrder
  }

  export type ProfileMinOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    privyUserId?: SortOrder
    role?: SortOrder
    referrerWallet?: SortOrder
    encryptedMnemonic?: SortOrder
    mnemonicIv?: SortOrder
    mnemonicTag?: SortOrder
    isBanned?: SortOrder
    runBalanceSol?: SortOrder
    creatorRewardsSol?: SortOrder
    referralRewardsSol?: SortOrder
    ownerRewardsSol?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    lastSeenAt?: SortOrder
  }

  export type ProfileSumOrderByAggregateInput = {
    runBalanceSol?: SortOrder
    creatorRewardsSol?: SortOrder
    referralRewardsSol?: SortOrder
    ownerRewardsSol?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    mode?: QueryMode
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type EnumCoinStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CoinStatus | EnumCoinStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CoinStatus[] | ListEnumCoinStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CoinStatus[] | ListEnumCoinStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCoinStatusFilter<$PrismaModel> | $Enums.CoinStatus
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type ProfileScalarRelationFilter = {
    is?: ProfileWhereInput
    isNot?: ProfileWhereInput
  }

  export type CandleListRelationFilter = {
    every?: CandleWhereInput
    some?: CandleWhereInput
    none?: CandleWhereInput
  }

  export type CandleOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type CoinCountOrderByAggregateInput = {
    id?: SortOrder
    mintAddress?: SortOrder
    creatorWallet?: SortOrder
    name?: SortOrder
    symbol?: SortOrder
    description?: SortOrder
    imageUri?: SortOrder
    metadataUri?: SortOrder
    status?: SortOrder
    version?: SortOrder
    virtualSolReserves?: SortOrder
    virtualTokenReserves?: SortOrder
    realSolReserves?: SortOrder
    realTokenReserves?: SortOrder
    totalFeesCollected?: SortOrder
    creatorFeeSnapshot?: SortOrder
    referrerFeeSnapshot?: SortOrder
    referrerWallet?: SortOrder
    graduationInitiatedAt?: SortOrder
    graduationCompletedAt?: SortOrder
    raydiumPoolAddress?: SortOrder
    lpMintAddress?: SortOrder
    lpTokensBurned?: SortOrder
    mintAuthorityRevoked?: SortOrder
    freezeAuthorityRevoked?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CoinAvgOrderByAggregateInput = {
    version?: SortOrder
    virtualSolReserves?: SortOrder
    virtualTokenReserves?: SortOrder
    realSolReserves?: SortOrder
    realTokenReserves?: SortOrder
    totalFeesCollected?: SortOrder
    creatorFeeSnapshot?: SortOrder
    referrerFeeSnapshot?: SortOrder
  }

  export type CoinMaxOrderByAggregateInput = {
    id?: SortOrder
    mintAddress?: SortOrder
    creatorWallet?: SortOrder
    name?: SortOrder
    symbol?: SortOrder
    description?: SortOrder
    imageUri?: SortOrder
    metadataUri?: SortOrder
    status?: SortOrder
    version?: SortOrder
    virtualSolReserves?: SortOrder
    virtualTokenReserves?: SortOrder
    realSolReserves?: SortOrder
    realTokenReserves?: SortOrder
    totalFeesCollected?: SortOrder
    creatorFeeSnapshot?: SortOrder
    referrerFeeSnapshot?: SortOrder
    referrerWallet?: SortOrder
    graduationInitiatedAt?: SortOrder
    graduationCompletedAt?: SortOrder
    raydiumPoolAddress?: SortOrder
    lpMintAddress?: SortOrder
    lpTokensBurned?: SortOrder
    mintAuthorityRevoked?: SortOrder
    freezeAuthorityRevoked?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CoinMinOrderByAggregateInput = {
    id?: SortOrder
    mintAddress?: SortOrder
    creatorWallet?: SortOrder
    name?: SortOrder
    symbol?: SortOrder
    description?: SortOrder
    imageUri?: SortOrder
    metadataUri?: SortOrder
    status?: SortOrder
    version?: SortOrder
    virtualSolReserves?: SortOrder
    virtualTokenReserves?: SortOrder
    realSolReserves?: SortOrder
    realTokenReserves?: SortOrder
    totalFeesCollected?: SortOrder
    creatorFeeSnapshot?: SortOrder
    referrerFeeSnapshot?: SortOrder
    referrerWallet?: SortOrder
    graduationInitiatedAt?: SortOrder
    graduationCompletedAt?: SortOrder
    raydiumPoolAddress?: SortOrder
    lpMintAddress?: SortOrder
    lpTokensBurned?: SortOrder
    mintAuthorityRevoked?: SortOrder
    freezeAuthorityRevoked?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type CoinSumOrderByAggregateInput = {
    version?: SortOrder
    virtualSolReserves?: SortOrder
    virtualTokenReserves?: SortOrder
    realSolReserves?: SortOrder
    realTokenReserves?: SortOrder
    totalFeesCollected?: SortOrder
    creatorFeeSnapshot?: SortOrder
    referrerFeeSnapshot?: SortOrder
  }

  export type EnumCoinStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CoinStatus | EnumCoinStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CoinStatus[] | ListEnumCoinStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CoinStatus[] | ListEnumCoinStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCoinStatusWithAggregatesFilter<$PrismaModel> | $Enums.CoinStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCoinStatusFilter<$PrismaModel>
    _max?: NestedEnumCoinStatusFilter<$PrismaModel>
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type CoinScalarRelationFilter = {
    is?: CoinWhereInput
    isNot?: CoinWhereInput
  }

  export type HoldingWalletAddressCoinIdCompoundUniqueInput = {
    walletAddress: string
    coinId: string
  }

  export type HoldingCountOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    coinId?: SortOrder
    tokenBalance?: SortOrder
    costBasisSol?: SortOrder
    totalBought?: SortOrder
    totalSold?: SortOrder
    updatedAt?: SortOrder
  }

  export type HoldingAvgOrderByAggregateInput = {
    tokenBalance?: SortOrder
    costBasisSol?: SortOrder
    totalBought?: SortOrder
    totalSold?: SortOrder
  }

  export type HoldingMaxOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    coinId?: SortOrder
    tokenBalance?: SortOrder
    costBasisSol?: SortOrder
    totalBought?: SortOrder
    totalSold?: SortOrder
    updatedAt?: SortOrder
  }

  export type HoldingMinOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    coinId?: SortOrder
    tokenBalance?: SortOrder
    costBasisSol?: SortOrder
    totalBought?: SortOrder
    totalSold?: SortOrder
    updatedAt?: SortOrder
  }

  export type HoldingSumOrderByAggregateInput = {
    tokenBalance?: SortOrder
    costBasisSol?: SortOrder
    totalBought?: SortOrder
    totalSold?: SortOrder
  }

  export type EnumTradeTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TradeType | EnumTradeTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TradeType[] | ListEnumTradeTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TradeType[] | ListEnumTradeTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTradeTypeFilter<$PrismaModel> | $Enums.TradeType
  }

  export type BigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type TransactionCountOrderByAggregateInput = {
    id?: SortOrder
    coinId?: SortOrder
    walletAddress?: SortOrder
    tradeType?: SortOrder
    txSignature?: SortOrder
    slot?: SortOrder
    solAmount?: SortOrder
    tokenAmount?: SortOrder
    pricePerToken?: SortOrder
    totalFee?: SortOrder
    creatorFee?: SortOrder
    referrerFee?: SortOrder
    treasuryFee?: SortOrder
    virtualSolAfter?: SortOrder
    virtualTokensAfter?: SortOrder
    confirmedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionAvgOrderByAggregateInput = {
    slot?: SortOrder
    solAmount?: SortOrder
    tokenAmount?: SortOrder
    pricePerToken?: SortOrder
    totalFee?: SortOrder
    creatorFee?: SortOrder
    referrerFee?: SortOrder
    treasuryFee?: SortOrder
    virtualSolAfter?: SortOrder
    virtualTokensAfter?: SortOrder
  }

  export type TransactionMaxOrderByAggregateInput = {
    id?: SortOrder
    coinId?: SortOrder
    walletAddress?: SortOrder
    tradeType?: SortOrder
    txSignature?: SortOrder
    slot?: SortOrder
    solAmount?: SortOrder
    tokenAmount?: SortOrder
    pricePerToken?: SortOrder
    totalFee?: SortOrder
    creatorFee?: SortOrder
    referrerFee?: SortOrder
    treasuryFee?: SortOrder
    virtualSolAfter?: SortOrder
    virtualTokensAfter?: SortOrder
    confirmedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionMinOrderByAggregateInput = {
    id?: SortOrder
    coinId?: SortOrder
    walletAddress?: SortOrder
    tradeType?: SortOrder
    txSignature?: SortOrder
    slot?: SortOrder
    solAmount?: SortOrder
    tokenAmount?: SortOrder
    pricePerToken?: SortOrder
    totalFee?: SortOrder
    creatorFee?: SortOrder
    referrerFee?: SortOrder
    treasuryFee?: SortOrder
    virtualSolAfter?: SortOrder
    virtualTokensAfter?: SortOrder
    confirmedAt?: SortOrder
    createdAt?: SortOrder
  }

  export type TransactionSumOrderByAggregateInput = {
    slot?: SortOrder
    solAmount?: SortOrder
    tokenAmount?: SortOrder
    pricePerToken?: SortOrder
    totalFee?: SortOrder
    creatorFee?: SortOrder
    referrerFee?: SortOrder
    treasuryFee?: SortOrder
    virtualSolAfter?: SortOrder
    virtualTokensAfter?: SortOrder
  }

  export type EnumTradeTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TradeType | EnumTradeTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TradeType[] | ListEnumTradeTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TradeType[] | ListEnumTradeTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTradeTypeWithAggregatesFilter<$PrismaModel> | $Enums.TradeType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTradeTypeFilter<$PrismaModel>
    _max?: NestedEnumTradeTypeFilter<$PrismaModel>
  }

  export type BigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type EnumTimeframeFilter<$PrismaModel = never> = {
    equals?: $Enums.Timeframe | EnumTimeframeFieldRefInput<$PrismaModel>
    in?: $Enums.Timeframe[] | ListEnumTimeframeFieldRefInput<$PrismaModel>
    notIn?: $Enums.Timeframe[] | ListEnumTimeframeFieldRefInput<$PrismaModel>
    not?: NestedEnumTimeframeFilter<$PrismaModel> | $Enums.Timeframe
  }

  export type CandleCoinIdTimeframeOpenTimeCompoundUniqueInput = {
    coinId: string
    timeframe: $Enums.Timeframe
    openTime: bigint | number
  }

  export type CandleCountOrderByAggregateInput = {
    id?: SortOrder
    coinId?: SortOrder
    timeframe?: SortOrder
    openTime?: SortOrder
    open?: SortOrder
    high?: SortOrder
    low?: SortOrder
    close?: SortOrder
    volume?: SortOrder
    trades?: SortOrder
    updatedAt?: SortOrder
  }

  export type CandleAvgOrderByAggregateInput = {
    openTime?: SortOrder
    open?: SortOrder
    high?: SortOrder
    low?: SortOrder
    close?: SortOrder
    volume?: SortOrder
    trades?: SortOrder
  }

  export type CandleMaxOrderByAggregateInput = {
    id?: SortOrder
    coinId?: SortOrder
    timeframe?: SortOrder
    openTime?: SortOrder
    open?: SortOrder
    high?: SortOrder
    low?: SortOrder
    close?: SortOrder
    volume?: SortOrder
    trades?: SortOrder
    updatedAt?: SortOrder
  }

  export type CandleMinOrderByAggregateInput = {
    id?: SortOrder
    coinId?: SortOrder
    timeframe?: SortOrder
    openTime?: SortOrder
    open?: SortOrder
    high?: SortOrder
    low?: SortOrder
    close?: SortOrder
    volume?: SortOrder
    trades?: SortOrder
    updatedAt?: SortOrder
  }

  export type CandleSumOrderByAggregateInput = {
    openTime?: SortOrder
    open?: SortOrder
    high?: SortOrder
    low?: SortOrder
    close?: SortOrder
    volume?: SortOrder
    trades?: SortOrder
  }

  export type EnumTimeframeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Timeframe | EnumTimeframeFieldRefInput<$PrismaModel>
    in?: $Enums.Timeframe[] | ListEnumTimeframeFieldRefInput<$PrismaModel>
    notIn?: $Enums.Timeframe[] | ListEnumTimeframeFieldRefInput<$PrismaModel>
    not?: NestedEnumTimeframeWithAggregatesFilter<$PrismaModel> | $Enums.Timeframe
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTimeframeFilter<$PrismaModel>
    _max?: NestedEnumTimeframeFilter<$PrismaModel>
  }

  export type ReferralAccountCountOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    totalFeesEarned?: SortOrder
    totalFeesClaimed?: SortOrder
    pendingFees?: SortOrder
    referralCount?: SortOrder
    lastClaimedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralAccountAvgOrderByAggregateInput = {
    totalFeesEarned?: SortOrder
    totalFeesClaimed?: SortOrder
    pendingFees?: SortOrder
    referralCount?: SortOrder
  }

  export type ReferralAccountMaxOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    totalFeesEarned?: SortOrder
    totalFeesClaimed?: SortOrder
    pendingFees?: SortOrder
    referralCount?: SortOrder
    lastClaimedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralAccountMinOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    totalFeesEarned?: SortOrder
    totalFeesClaimed?: SortOrder
    pendingFees?: SortOrder
    referralCount?: SortOrder
    lastClaimedAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type ReferralAccountSumOrderByAggregateInput = {
    totalFeesEarned?: SortOrder
    totalFeesClaimed?: SortOrder
    pendingFees?: SortOrder
    referralCount?: SortOrder
  }

  export type TreasuryEventCountOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    coinId?: SortOrder
    txSignature?: SortOrder
    amountLamports?: SortOrder
    cumulativeTotal?: SortOrder
    memo?: SortOrder
    createdAt?: SortOrder
  }

  export type TreasuryEventAvgOrderByAggregateInput = {
    amountLamports?: SortOrder
    cumulativeTotal?: SortOrder
  }

  export type TreasuryEventMaxOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    coinId?: SortOrder
    txSignature?: SortOrder
    amountLamports?: SortOrder
    cumulativeTotal?: SortOrder
    memo?: SortOrder
    createdAt?: SortOrder
  }

  export type TreasuryEventMinOrderByAggregateInput = {
    id?: SortOrder
    eventType?: SortOrder
    coinId?: SortOrder
    txSignature?: SortOrder
    amountLamports?: SortOrder
    cumulativeTotal?: SortOrder
    memo?: SortOrder
    createdAt?: SortOrder
  }

  export type TreasuryEventSumOrderByAggregateInput = {
    amountLamports?: SortOrder
    cumulativeTotal?: SortOrder
  }

  export type EnumAuditActionFilter<$PrismaModel = never> = {
    equals?: $Enums.AuditAction | EnumAuditActionFieldRefInput<$PrismaModel>
    in?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    not?: NestedEnumAuditActionFilter<$PrismaModel> | $Enums.AuditAction
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type AuditLogCountOrderByAggregateInput = {
    id?: SortOrder
    action?: SortOrder
    actorWallet?: SortOrder
    targetId?: SortOrder
    oldValue?: SortOrder
    newValue?: SortOrder
    txSignature?: SortOrder
    ipAddress?: SortOrder
    userAgent?: SortOrder
    createdAt?: SortOrder
  }

  export type AuditLogAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type AuditLogMaxOrderByAggregateInput = {
    id?: SortOrder
    action?: SortOrder
    actorWallet?: SortOrder
    targetId?: SortOrder
    txSignature?: SortOrder
    ipAddress?: SortOrder
    userAgent?: SortOrder
    createdAt?: SortOrder
  }

  export type AuditLogMinOrderByAggregateInput = {
    id?: SortOrder
    action?: SortOrder
    actorWallet?: SortOrder
    targetId?: SortOrder
    txSignature?: SortOrder
    ipAddress?: SortOrder
    userAgent?: SortOrder
    createdAt?: SortOrder
  }

  export type AuditLogSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type EnumAuditActionWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AuditAction | EnumAuditActionFieldRefInput<$PrismaModel>
    in?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    not?: NestedEnumAuditActionWithAggregatesFilter<$PrismaModel> | $Enums.AuditAction
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAuditActionFilter<$PrismaModel>
    _max?: NestedEnumAuditActionFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type IndexerStateCountOrderByAggregateInput = {
    id?: SortOrder
    lastSlot?: SortOrder
    lastSignature?: SortOrder
    isHealthy?: SortOrder
    errorMessage?: SortOrder
    updatedAt?: SortOrder
  }

  export type IndexerStateAvgOrderByAggregateInput = {
    lastSlot?: SortOrder
  }

  export type IndexerStateMaxOrderByAggregateInput = {
    id?: SortOrder
    lastSlot?: SortOrder
    lastSignature?: SortOrder
    isHealthy?: SortOrder
    errorMessage?: SortOrder
    updatedAt?: SortOrder
  }

  export type IndexerStateMinOrderByAggregateInput = {
    id?: SortOrder
    lastSlot?: SortOrder
    lastSignature?: SortOrder
    isHealthy?: SortOrder
    errorMessage?: SortOrder
    updatedAt?: SortOrder
  }

  export type IndexerStateSumOrderByAggregateInput = {
    lastSlot?: SortOrder
  }

  export type EnumTxStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.TxStatus | EnumTxStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TxStatus[] | ListEnumTxStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TxStatus[] | ListEnumTxStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTxStatusFilter<$PrismaModel> | $Enums.TxStatus
  }

  export type BytesNullableFilter<$PrismaModel = never> = {
    equals?: Bytes | BytesFieldRefInput<$PrismaModel> | null
    in?: Bytes[] | ListBytesFieldRefInput<$PrismaModel> | null
    notIn?: Bytes[] | ListBytesFieldRefInput<$PrismaModel> | null
    not?: NestedBytesNullableFilter<$PrismaModel> | Bytes | null
  }

  export type BigIntNullableFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableFilter<$PrismaModel> | bigint | number | null
  }

  export type PendingTxCountOrderByAggregateInput = {
    id?: SortOrder
    idempotencyKey?: SortOrder
    walletAddress?: SortOrder
    operationType?: SortOrder
    coinId?: SortOrder
    status?: SortOrder
    serializedTx?: SortOrder
    signature?: SortOrder
    blockhash?: SortOrder
    lastValidBlockHeight?: SortOrder
    confirmedSlot?: SortOrder
    finalizedAt?: SortOrder
    errorMessage?: SortOrder
    errorCode?: SortOrder
    canResubmit?: SortOrder
    submitAttempts?: SortOrder
    lastSubmittedAt?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PendingTxAvgOrderByAggregateInput = {
    lastValidBlockHeight?: SortOrder
    confirmedSlot?: SortOrder
    submitAttempts?: SortOrder
  }

  export type PendingTxMaxOrderByAggregateInput = {
    id?: SortOrder
    idempotencyKey?: SortOrder
    walletAddress?: SortOrder
    operationType?: SortOrder
    coinId?: SortOrder
    status?: SortOrder
    serializedTx?: SortOrder
    signature?: SortOrder
    blockhash?: SortOrder
    lastValidBlockHeight?: SortOrder
    confirmedSlot?: SortOrder
    finalizedAt?: SortOrder
    errorMessage?: SortOrder
    errorCode?: SortOrder
    canResubmit?: SortOrder
    submitAttempts?: SortOrder
    lastSubmittedAt?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PendingTxMinOrderByAggregateInput = {
    id?: SortOrder
    idempotencyKey?: SortOrder
    walletAddress?: SortOrder
    operationType?: SortOrder
    coinId?: SortOrder
    status?: SortOrder
    serializedTx?: SortOrder
    signature?: SortOrder
    blockhash?: SortOrder
    lastValidBlockHeight?: SortOrder
    confirmedSlot?: SortOrder
    finalizedAt?: SortOrder
    errorMessage?: SortOrder
    errorCode?: SortOrder
    canResubmit?: SortOrder
    submitAttempts?: SortOrder
    lastSubmittedAt?: SortOrder
    expiresAt?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PendingTxSumOrderByAggregateInput = {
    lastValidBlockHeight?: SortOrder
    confirmedSlot?: SortOrder
    submitAttempts?: SortOrder
  }

  export type EnumTxStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TxStatus | EnumTxStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TxStatus[] | ListEnumTxStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TxStatus[] | ListEnumTxStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTxStatusWithAggregatesFilter<$PrismaModel> | $Enums.TxStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTxStatusFilter<$PrismaModel>
    _max?: NestedEnumTxStatusFilter<$PrismaModel>
  }

  export type BytesNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Bytes | BytesFieldRefInput<$PrismaModel> | null
    in?: Bytes[] | ListBytesFieldRefInput<$PrismaModel> | null
    notIn?: Bytes[] | ListBytesFieldRefInput<$PrismaModel> | null
    not?: NestedBytesNullableWithAggregatesFilter<$PrismaModel> | Bytes | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBytesNullableFilter<$PrismaModel>
    _max?: NestedBytesNullableFilter<$PrismaModel>
  }

  export type BigIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableWithAggregatesFilter<$PrismaModel> | bigint | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedBigIntNullableFilter<$PrismaModel>
    _min?: NestedBigIntNullableFilter<$PrismaModel>
    _max?: NestedBigIntNullableFilter<$PrismaModel>
  }

  export type PushSubscriptionWalletAddressTokenCompoundUniqueInput = {
    walletAddress: string
    token: string
  }

  export type PushSubscriptionCountOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    platform?: SortOrder
    token?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PushSubscriptionMaxOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    platform?: SortOrder
    token?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type PushSubscriptionMinOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    platform?: SortOrder
    token?: SortOrder
    isActive?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type DepositCountOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    txSignature?: SortOrder
    amountSol?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type DepositAvgOrderByAggregateInput = {
    amountSol?: SortOrder
  }

  export type DepositMaxOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    txSignature?: SortOrder
    amountSol?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type DepositMinOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    txSignature?: SortOrder
    amountSol?: SortOrder
    status?: SortOrder
    createdAt?: SortOrder
  }

  export type DepositSumOrderByAggregateInput = {
    amountSol?: SortOrder
  }

  export type DepositScanCountOrderByAggregateInput = {
    walletAddress?: SortOrder
    lastSignature?: SortOrder
    updatedAt?: SortOrder
  }

  export type DepositScanMaxOrderByAggregateInput = {
    walletAddress?: SortOrder
    lastSignature?: SortOrder
    updatedAt?: SortOrder
  }

  export type DepositScanMinOrderByAggregateInput = {
    walletAddress?: SortOrder
    lastSignature?: SortOrder
    updatedAt?: SortOrder
  }

  export type WithdrawalCountOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    destination?: SortOrder
    amountSol?: SortOrder
    txSignature?: SortOrder
    status?: SortOrder
    idempotencyKey?: SortOrder
    createdAt?: SortOrder
  }

  export type WithdrawalAvgOrderByAggregateInput = {
    amountSol?: SortOrder
  }

  export type WithdrawalMaxOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    destination?: SortOrder
    amountSol?: SortOrder
    txSignature?: SortOrder
    status?: SortOrder
    idempotencyKey?: SortOrder
    createdAt?: SortOrder
  }

  export type WithdrawalMinOrderByAggregateInput = {
    id?: SortOrder
    walletAddress?: SortOrder
    destination?: SortOrder
    amountSol?: SortOrder
    txSignature?: SortOrder
    status?: SortOrder
    idempotencyKey?: SortOrder
    createdAt?: SortOrder
  }

  export type WithdrawalSumOrderByAggregateInput = {
    amountSol?: SortOrder
  }

  export type CoinCreateNestedManyWithoutCreatorInput = {
    create?: XOR<CoinCreateWithoutCreatorInput, CoinUncheckedCreateWithoutCreatorInput> | CoinCreateWithoutCreatorInput[] | CoinUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CoinCreateOrConnectWithoutCreatorInput | CoinCreateOrConnectWithoutCreatorInput[]
    createMany?: CoinCreateManyCreatorInputEnvelope
    connect?: CoinWhereUniqueInput | CoinWhereUniqueInput[]
  }

  export type TransactionCreateNestedManyWithoutProfileInput = {
    create?: XOR<TransactionCreateWithoutProfileInput, TransactionUncheckedCreateWithoutProfileInput> | TransactionCreateWithoutProfileInput[] | TransactionUncheckedCreateWithoutProfileInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutProfileInput | TransactionCreateOrConnectWithoutProfileInput[]
    createMany?: TransactionCreateManyProfileInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type HoldingCreateNestedManyWithoutProfileInput = {
    create?: XOR<HoldingCreateWithoutProfileInput, HoldingUncheckedCreateWithoutProfileInput> | HoldingCreateWithoutProfileInput[] | HoldingUncheckedCreateWithoutProfileInput[]
    connectOrCreate?: HoldingCreateOrConnectWithoutProfileInput | HoldingCreateOrConnectWithoutProfileInput[]
    createMany?: HoldingCreateManyProfileInputEnvelope
    connect?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
  }

  export type CoinUncheckedCreateNestedManyWithoutCreatorInput = {
    create?: XOR<CoinCreateWithoutCreatorInput, CoinUncheckedCreateWithoutCreatorInput> | CoinCreateWithoutCreatorInput[] | CoinUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CoinCreateOrConnectWithoutCreatorInput | CoinCreateOrConnectWithoutCreatorInput[]
    createMany?: CoinCreateManyCreatorInputEnvelope
    connect?: CoinWhereUniqueInput | CoinWhereUniqueInput[]
  }

  export type TransactionUncheckedCreateNestedManyWithoutProfileInput = {
    create?: XOR<TransactionCreateWithoutProfileInput, TransactionUncheckedCreateWithoutProfileInput> | TransactionCreateWithoutProfileInput[] | TransactionUncheckedCreateWithoutProfileInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutProfileInput | TransactionCreateOrConnectWithoutProfileInput[]
    createMany?: TransactionCreateManyProfileInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type HoldingUncheckedCreateNestedManyWithoutProfileInput = {
    create?: XOR<HoldingCreateWithoutProfileInput, HoldingUncheckedCreateWithoutProfileInput> | HoldingCreateWithoutProfileInput[] | HoldingUncheckedCreateWithoutProfileInput[]
    connectOrCreate?: HoldingCreateOrConnectWithoutProfileInput | HoldingCreateOrConnectWithoutProfileInput[]
    createMany?: HoldingCreateManyProfileInputEnvelope
    connect?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumUserRoleFieldUpdateOperationsInput = {
    set?: $Enums.UserRole
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type CoinUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<CoinCreateWithoutCreatorInput, CoinUncheckedCreateWithoutCreatorInput> | CoinCreateWithoutCreatorInput[] | CoinUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CoinCreateOrConnectWithoutCreatorInput | CoinCreateOrConnectWithoutCreatorInput[]
    upsert?: CoinUpsertWithWhereUniqueWithoutCreatorInput | CoinUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: CoinCreateManyCreatorInputEnvelope
    set?: CoinWhereUniqueInput | CoinWhereUniqueInput[]
    disconnect?: CoinWhereUniqueInput | CoinWhereUniqueInput[]
    delete?: CoinWhereUniqueInput | CoinWhereUniqueInput[]
    connect?: CoinWhereUniqueInput | CoinWhereUniqueInput[]
    update?: CoinUpdateWithWhereUniqueWithoutCreatorInput | CoinUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: CoinUpdateManyWithWhereWithoutCreatorInput | CoinUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: CoinScalarWhereInput | CoinScalarWhereInput[]
  }

  export type TransactionUpdateManyWithoutProfileNestedInput = {
    create?: XOR<TransactionCreateWithoutProfileInput, TransactionUncheckedCreateWithoutProfileInput> | TransactionCreateWithoutProfileInput[] | TransactionUncheckedCreateWithoutProfileInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutProfileInput | TransactionCreateOrConnectWithoutProfileInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutProfileInput | TransactionUpsertWithWhereUniqueWithoutProfileInput[]
    createMany?: TransactionCreateManyProfileInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutProfileInput | TransactionUpdateWithWhereUniqueWithoutProfileInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutProfileInput | TransactionUpdateManyWithWhereWithoutProfileInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type HoldingUpdateManyWithoutProfileNestedInput = {
    create?: XOR<HoldingCreateWithoutProfileInput, HoldingUncheckedCreateWithoutProfileInput> | HoldingCreateWithoutProfileInput[] | HoldingUncheckedCreateWithoutProfileInput[]
    connectOrCreate?: HoldingCreateOrConnectWithoutProfileInput | HoldingCreateOrConnectWithoutProfileInput[]
    upsert?: HoldingUpsertWithWhereUniqueWithoutProfileInput | HoldingUpsertWithWhereUniqueWithoutProfileInput[]
    createMany?: HoldingCreateManyProfileInputEnvelope
    set?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    disconnect?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    delete?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    connect?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    update?: HoldingUpdateWithWhereUniqueWithoutProfileInput | HoldingUpdateWithWhereUniqueWithoutProfileInput[]
    updateMany?: HoldingUpdateManyWithWhereWithoutProfileInput | HoldingUpdateManyWithWhereWithoutProfileInput[]
    deleteMany?: HoldingScalarWhereInput | HoldingScalarWhereInput[]
  }

  export type CoinUncheckedUpdateManyWithoutCreatorNestedInput = {
    create?: XOR<CoinCreateWithoutCreatorInput, CoinUncheckedCreateWithoutCreatorInput> | CoinCreateWithoutCreatorInput[] | CoinUncheckedCreateWithoutCreatorInput[]
    connectOrCreate?: CoinCreateOrConnectWithoutCreatorInput | CoinCreateOrConnectWithoutCreatorInput[]
    upsert?: CoinUpsertWithWhereUniqueWithoutCreatorInput | CoinUpsertWithWhereUniqueWithoutCreatorInput[]
    createMany?: CoinCreateManyCreatorInputEnvelope
    set?: CoinWhereUniqueInput | CoinWhereUniqueInput[]
    disconnect?: CoinWhereUniqueInput | CoinWhereUniqueInput[]
    delete?: CoinWhereUniqueInput | CoinWhereUniqueInput[]
    connect?: CoinWhereUniqueInput | CoinWhereUniqueInput[]
    update?: CoinUpdateWithWhereUniqueWithoutCreatorInput | CoinUpdateWithWhereUniqueWithoutCreatorInput[]
    updateMany?: CoinUpdateManyWithWhereWithoutCreatorInput | CoinUpdateManyWithWhereWithoutCreatorInput[]
    deleteMany?: CoinScalarWhereInput | CoinScalarWhereInput[]
  }

  export type TransactionUncheckedUpdateManyWithoutProfileNestedInput = {
    create?: XOR<TransactionCreateWithoutProfileInput, TransactionUncheckedCreateWithoutProfileInput> | TransactionCreateWithoutProfileInput[] | TransactionUncheckedCreateWithoutProfileInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutProfileInput | TransactionCreateOrConnectWithoutProfileInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutProfileInput | TransactionUpsertWithWhereUniqueWithoutProfileInput[]
    createMany?: TransactionCreateManyProfileInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutProfileInput | TransactionUpdateWithWhereUniqueWithoutProfileInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutProfileInput | TransactionUpdateManyWithWhereWithoutProfileInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type HoldingUncheckedUpdateManyWithoutProfileNestedInput = {
    create?: XOR<HoldingCreateWithoutProfileInput, HoldingUncheckedCreateWithoutProfileInput> | HoldingCreateWithoutProfileInput[] | HoldingUncheckedCreateWithoutProfileInput[]
    connectOrCreate?: HoldingCreateOrConnectWithoutProfileInput | HoldingCreateOrConnectWithoutProfileInput[]
    upsert?: HoldingUpsertWithWhereUniqueWithoutProfileInput | HoldingUpsertWithWhereUniqueWithoutProfileInput[]
    createMany?: HoldingCreateManyProfileInputEnvelope
    set?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    disconnect?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    delete?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    connect?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    update?: HoldingUpdateWithWhereUniqueWithoutProfileInput | HoldingUpdateWithWhereUniqueWithoutProfileInput[]
    updateMany?: HoldingUpdateManyWithWhereWithoutProfileInput | HoldingUpdateManyWithWhereWithoutProfileInput[]
    deleteMany?: HoldingScalarWhereInput | HoldingScalarWhereInput[]
  }

  export type ProfileCreateNestedOneWithoutCoinsInput = {
    create?: XOR<ProfileCreateWithoutCoinsInput, ProfileUncheckedCreateWithoutCoinsInput>
    connectOrCreate?: ProfileCreateOrConnectWithoutCoinsInput
    connect?: ProfileWhereUniqueInput
  }

  export type TransactionCreateNestedManyWithoutCoinInput = {
    create?: XOR<TransactionCreateWithoutCoinInput, TransactionUncheckedCreateWithoutCoinInput> | TransactionCreateWithoutCoinInput[] | TransactionUncheckedCreateWithoutCoinInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutCoinInput | TransactionCreateOrConnectWithoutCoinInput[]
    createMany?: TransactionCreateManyCoinInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type HoldingCreateNestedManyWithoutCoinInput = {
    create?: XOR<HoldingCreateWithoutCoinInput, HoldingUncheckedCreateWithoutCoinInput> | HoldingCreateWithoutCoinInput[] | HoldingUncheckedCreateWithoutCoinInput[]
    connectOrCreate?: HoldingCreateOrConnectWithoutCoinInput | HoldingCreateOrConnectWithoutCoinInput[]
    createMany?: HoldingCreateManyCoinInputEnvelope
    connect?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
  }

  export type CandleCreateNestedManyWithoutCoinInput = {
    create?: XOR<CandleCreateWithoutCoinInput, CandleUncheckedCreateWithoutCoinInput> | CandleCreateWithoutCoinInput[] | CandleUncheckedCreateWithoutCoinInput[]
    connectOrCreate?: CandleCreateOrConnectWithoutCoinInput | CandleCreateOrConnectWithoutCoinInput[]
    createMany?: CandleCreateManyCoinInputEnvelope
    connect?: CandleWhereUniqueInput | CandleWhereUniqueInput[]
  }

  export type TransactionUncheckedCreateNestedManyWithoutCoinInput = {
    create?: XOR<TransactionCreateWithoutCoinInput, TransactionUncheckedCreateWithoutCoinInput> | TransactionCreateWithoutCoinInput[] | TransactionUncheckedCreateWithoutCoinInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutCoinInput | TransactionCreateOrConnectWithoutCoinInput[]
    createMany?: TransactionCreateManyCoinInputEnvelope
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
  }

  export type HoldingUncheckedCreateNestedManyWithoutCoinInput = {
    create?: XOR<HoldingCreateWithoutCoinInput, HoldingUncheckedCreateWithoutCoinInput> | HoldingCreateWithoutCoinInput[] | HoldingUncheckedCreateWithoutCoinInput[]
    connectOrCreate?: HoldingCreateOrConnectWithoutCoinInput | HoldingCreateOrConnectWithoutCoinInput[]
    createMany?: HoldingCreateManyCoinInputEnvelope
    connect?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
  }

  export type CandleUncheckedCreateNestedManyWithoutCoinInput = {
    create?: XOR<CandleCreateWithoutCoinInput, CandleUncheckedCreateWithoutCoinInput> | CandleCreateWithoutCoinInput[] | CandleUncheckedCreateWithoutCoinInput[]
    connectOrCreate?: CandleCreateOrConnectWithoutCoinInput | CandleCreateOrConnectWithoutCoinInput[]
    createMany?: CandleCreateManyCoinInputEnvelope
    connect?: CandleWhereUniqueInput | CandleWhereUniqueInput[]
  }

  export type EnumCoinStatusFieldUpdateOperationsInput = {
    set?: $Enums.CoinStatus
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type ProfileUpdateOneRequiredWithoutCoinsNestedInput = {
    create?: XOR<ProfileCreateWithoutCoinsInput, ProfileUncheckedCreateWithoutCoinsInput>
    connectOrCreate?: ProfileCreateOrConnectWithoutCoinsInput
    upsert?: ProfileUpsertWithoutCoinsInput
    connect?: ProfileWhereUniqueInput
    update?: XOR<XOR<ProfileUpdateToOneWithWhereWithoutCoinsInput, ProfileUpdateWithoutCoinsInput>, ProfileUncheckedUpdateWithoutCoinsInput>
  }

  export type TransactionUpdateManyWithoutCoinNestedInput = {
    create?: XOR<TransactionCreateWithoutCoinInput, TransactionUncheckedCreateWithoutCoinInput> | TransactionCreateWithoutCoinInput[] | TransactionUncheckedCreateWithoutCoinInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutCoinInput | TransactionCreateOrConnectWithoutCoinInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutCoinInput | TransactionUpsertWithWhereUniqueWithoutCoinInput[]
    createMany?: TransactionCreateManyCoinInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutCoinInput | TransactionUpdateWithWhereUniqueWithoutCoinInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutCoinInput | TransactionUpdateManyWithWhereWithoutCoinInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type HoldingUpdateManyWithoutCoinNestedInput = {
    create?: XOR<HoldingCreateWithoutCoinInput, HoldingUncheckedCreateWithoutCoinInput> | HoldingCreateWithoutCoinInput[] | HoldingUncheckedCreateWithoutCoinInput[]
    connectOrCreate?: HoldingCreateOrConnectWithoutCoinInput | HoldingCreateOrConnectWithoutCoinInput[]
    upsert?: HoldingUpsertWithWhereUniqueWithoutCoinInput | HoldingUpsertWithWhereUniqueWithoutCoinInput[]
    createMany?: HoldingCreateManyCoinInputEnvelope
    set?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    disconnect?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    delete?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    connect?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    update?: HoldingUpdateWithWhereUniqueWithoutCoinInput | HoldingUpdateWithWhereUniqueWithoutCoinInput[]
    updateMany?: HoldingUpdateManyWithWhereWithoutCoinInput | HoldingUpdateManyWithWhereWithoutCoinInput[]
    deleteMany?: HoldingScalarWhereInput | HoldingScalarWhereInput[]
  }

  export type CandleUpdateManyWithoutCoinNestedInput = {
    create?: XOR<CandleCreateWithoutCoinInput, CandleUncheckedCreateWithoutCoinInput> | CandleCreateWithoutCoinInput[] | CandleUncheckedCreateWithoutCoinInput[]
    connectOrCreate?: CandleCreateOrConnectWithoutCoinInput | CandleCreateOrConnectWithoutCoinInput[]
    upsert?: CandleUpsertWithWhereUniqueWithoutCoinInput | CandleUpsertWithWhereUniqueWithoutCoinInput[]
    createMany?: CandleCreateManyCoinInputEnvelope
    set?: CandleWhereUniqueInput | CandleWhereUniqueInput[]
    disconnect?: CandleWhereUniqueInput | CandleWhereUniqueInput[]
    delete?: CandleWhereUniqueInput | CandleWhereUniqueInput[]
    connect?: CandleWhereUniqueInput | CandleWhereUniqueInput[]
    update?: CandleUpdateWithWhereUniqueWithoutCoinInput | CandleUpdateWithWhereUniqueWithoutCoinInput[]
    updateMany?: CandleUpdateManyWithWhereWithoutCoinInput | CandleUpdateManyWithWhereWithoutCoinInput[]
    deleteMany?: CandleScalarWhereInput | CandleScalarWhereInput[]
  }

  export type TransactionUncheckedUpdateManyWithoutCoinNestedInput = {
    create?: XOR<TransactionCreateWithoutCoinInput, TransactionUncheckedCreateWithoutCoinInput> | TransactionCreateWithoutCoinInput[] | TransactionUncheckedCreateWithoutCoinInput[]
    connectOrCreate?: TransactionCreateOrConnectWithoutCoinInput | TransactionCreateOrConnectWithoutCoinInput[]
    upsert?: TransactionUpsertWithWhereUniqueWithoutCoinInput | TransactionUpsertWithWhereUniqueWithoutCoinInput[]
    createMany?: TransactionCreateManyCoinInputEnvelope
    set?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    disconnect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    delete?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    connect?: TransactionWhereUniqueInput | TransactionWhereUniqueInput[]
    update?: TransactionUpdateWithWhereUniqueWithoutCoinInput | TransactionUpdateWithWhereUniqueWithoutCoinInput[]
    updateMany?: TransactionUpdateManyWithWhereWithoutCoinInput | TransactionUpdateManyWithWhereWithoutCoinInput[]
    deleteMany?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
  }

  export type HoldingUncheckedUpdateManyWithoutCoinNestedInput = {
    create?: XOR<HoldingCreateWithoutCoinInput, HoldingUncheckedCreateWithoutCoinInput> | HoldingCreateWithoutCoinInput[] | HoldingUncheckedCreateWithoutCoinInput[]
    connectOrCreate?: HoldingCreateOrConnectWithoutCoinInput | HoldingCreateOrConnectWithoutCoinInput[]
    upsert?: HoldingUpsertWithWhereUniqueWithoutCoinInput | HoldingUpsertWithWhereUniqueWithoutCoinInput[]
    createMany?: HoldingCreateManyCoinInputEnvelope
    set?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    disconnect?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    delete?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    connect?: HoldingWhereUniqueInput | HoldingWhereUniqueInput[]
    update?: HoldingUpdateWithWhereUniqueWithoutCoinInput | HoldingUpdateWithWhereUniqueWithoutCoinInput[]
    updateMany?: HoldingUpdateManyWithWhereWithoutCoinInput | HoldingUpdateManyWithWhereWithoutCoinInput[]
    deleteMany?: HoldingScalarWhereInput | HoldingScalarWhereInput[]
  }

  export type CandleUncheckedUpdateManyWithoutCoinNestedInput = {
    create?: XOR<CandleCreateWithoutCoinInput, CandleUncheckedCreateWithoutCoinInput> | CandleCreateWithoutCoinInput[] | CandleUncheckedCreateWithoutCoinInput[]
    connectOrCreate?: CandleCreateOrConnectWithoutCoinInput | CandleCreateOrConnectWithoutCoinInput[]
    upsert?: CandleUpsertWithWhereUniqueWithoutCoinInput | CandleUpsertWithWhereUniqueWithoutCoinInput[]
    createMany?: CandleCreateManyCoinInputEnvelope
    set?: CandleWhereUniqueInput | CandleWhereUniqueInput[]
    disconnect?: CandleWhereUniqueInput | CandleWhereUniqueInput[]
    delete?: CandleWhereUniqueInput | CandleWhereUniqueInput[]
    connect?: CandleWhereUniqueInput | CandleWhereUniqueInput[]
    update?: CandleUpdateWithWhereUniqueWithoutCoinInput | CandleUpdateWithWhereUniqueWithoutCoinInput[]
    updateMany?: CandleUpdateManyWithWhereWithoutCoinInput | CandleUpdateManyWithWhereWithoutCoinInput[]
    deleteMany?: CandleScalarWhereInput | CandleScalarWhereInput[]
  }

  export type ProfileCreateNestedOneWithoutHoldingsInput = {
    create?: XOR<ProfileCreateWithoutHoldingsInput, ProfileUncheckedCreateWithoutHoldingsInput>
    connectOrCreate?: ProfileCreateOrConnectWithoutHoldingsInput
    connect?: ProfileWhereUniqueInput
  }

  export type CoinCreateNestedOneWithoutHoldingsInput = {
    create?: XOR<CoinCreateWithoutHoldingsInput, CoinUncheckedCreateWithoutHoldingsInput>
    connectOrCreate?: CoinCreateOrConnectWithoutHoldingsInput
    connect?: CoinWhereUniqueInput
  }

  export type ProfileUpdateOneRequiredWithoutHoldingsNestedInput = {
    create?: XOR<ProfileCreateWithoutHoldingsInput, ProfileUncheckedCreateWithoutHoldingsInput>
    connectOrCreate?: ProfileCreateOrConnectWithoutHoldingsInput
    upsert?: ProfileUpsertWithoutHoldingsInput
    connect?: ProfileWhereUniqueInput
    update?: XOR<XOR<ProfileUpdateToOneWithWhereWithoutHoldingsInput, ProfileUpdateWithoutHoldingsInput>, ProfileUncheckedUpdateWithoutHoldingsInput>
  }

  export type CoinUpdateOneRequiredWithoutHoldingsNestedInput = {
    create?: XOR<CoinCreateWithoutHoldingsInput, CoinUncheckedCreateWithoutHoldingsInput>
    connectOrCreate?: CoinCreateOrConnectWithoutHoldingsInput
    upsert?: CoinUpsertWithoutHoldingsInput
    connect?: CoinWhereUniqueInput
    update?: XOR<XOR<CoinUpdateToOneWithWhereWithoutHoldingsInput, CoinUpdateWithoutHoldingsInput>, CoinUncheckedUpdateWithoutHoldingsInput>
  }

  export type CoinCreateNestedOneWithoutTransactionsInput = {
    create?: XOR<CoinCreateWithoutTransactionsInput, CoinUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: CoinCreateOrConnectWithoutTransactionsInput
    connect?: CoinWhereUniqueInput
  }

  export type ProfileCreateNestedOneWithoutTransactionsInput = {
    create?: XOR<ProfileCreateWithoutTransactionsInput, ProfileUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: ProfileCreateOrConnectWithoutTransactionsInput
    connect?: ProfileWhereUniqueInput
  }

  export type EnumTradeTypeFieldUpdateOperationsInput = {
    set?: $Enums.TradeType
  }

  export type BigIntFieldUpdateOperationsInput = {
    set?: bigint | number
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type CoinUpdateOneRequiredWithoutTransactionsNestedInput = {
    create?: XOR<CoinCreateWithoutTransactionsInput, CoinUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: CoinCreateOrConnectWithoutTransactionsInput
    upsert?: CoinUpsertWithoutTransactionsInput
    connect?: CoinWhereUniqueInput
    update?: XOR<XOR<CoinUpdateToOneWithWhereWithoutTransactionsInput, CoinUpdateWithoutTransactionsInput>, CoinUncheckedUpdateWithoutTransactionsInput>
  }

  export type ProfileUpdateOneRequiredWithoutTransactionsNestedInput = {
    create?: XOR<ProfileCreateWithoutTransactionsInput, ProfileUncheckedCreateWithoutTransactionsInput>
    connectOrCreate?: ProfileCreateOrConnectWithoutTransactionsInput
    upsert?: ProfileUpsertWithoutTransactionsInput
    connect?: ProfileWhereUniqueInput
    update?: XOR<XOR<ProfileUpdateToOneWithWhereWithoutTransactionsInput, ProfileUpdateWithoutTransactionsInput>, ProfileUncheckedUpdateWithoutTransactionsInput>
  }

  export type CoinCreateNestedOneWithoutCandlesInput = {
    create?: XOR<CoinCreateWithoutCandlesInput, CoinUncheckedCreateWithoutCandlesInput>
    connectOrCreate?: CoinCreateOrConnectWithoutCandlesInput
    connect?: CoinWhereUniqueInput
  }

  export type EnumTimeframeFieldUpdateOperationsInput = {
    set?: $Enums.Timeframe
  }

  export type CoinUpdateOneRequiredWithoutCandlesNestedInput = {
    create?: XOR<CoinCreateWithoutCandlesInput, CoinUncheckedCreateWithoutCandlesInput>
    connectOrCreate?: CoinCreateOrConnectWithoutCandlesInput
    upsert?: CoinUpsertWithoutCandlesInput
    connect?: CoinWhereUniqueInput
    update?: XOR<XOR<CoinUpdateToOneWithWhereWithoutCandlesInput, CoinUpdateWithoutCandlesInput>, CoinUncheckedUpdateWithoutCandlesInput>
  }

  export type EnumAuditActionFieldUpdateOperationsInput = {
    set?: $Enums.AuditAction
  }

  export type EnumTxStatusFieldUpdateOperationsInput = {
    set?: $Enums.TxStatus
  }

  export type NullableBytesFieldUpdateOperationsInput = {
    set?: Bytes | null
  }

  export type NullableBigIntFieldUpdateOperationsInput = {
    set?: bigint | number | null
    increment?: bigint | number
    decrement?: bigint | number
    multiply?: bigint | number
    divide?: bigint | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumUserRoleFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleFilter<$PrismaModel> | $Enums.UserRole
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[] | ListStringFieldRefInput<$PrismaModel>
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel>
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedEnumUserRoleWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserRole | EnumUserRoleFieldRefInput<$PrismaModel>
    in?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    notIn?: $Enums.UserRole[] | ListEnumUserRoleFieldRefInput<$PrismaModel>
    not?: NestedEnumUserRoleWithAggregatesFilter<$PrismaModel> | $Enums.UserRole
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserRoleFilter<$PrismaModel>
    _max?: NestedEnumUserRoleFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    notIn?: string[] | ListStringFieldRefInput<$PrismaModel> | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel> | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel>
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel>
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    notIn?: Date[] | string[] | ListDateTimeFieldRefInput<$PrismaModel> | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumCoinStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.CoinStatus | EnumCoinStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CoinStatus[] | ListEnumCoinStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CoinStatus[] | ListEnumCoinStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCoinStatusFilter<$PrismaModel> | $Enums.CoinStatus
  }

  export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type NestedEnumCoinStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.CoinStatus | EnumCoinStatusFieldRefInput<$PrismaModel>
    in?: $Enums.CoinStatus[] | ListEnumCoinStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.CoinStatus[] | ListEnumCoinStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumCoinStatusWithAggregatesFilter<$PrismaModel> | $Enums.CoinStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumCoinStatusFilter<$PrismaModel>
    _max?: NestedEnumCoinStatusFilter<$PrismaModel>
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[] | ListIntFieldRefInput<$PrismaModel>
    notIn?: number[] | ListIntFieldRefInput<$PrismaModel>
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[] | ListFloatFieldRefInput<$PrismaModel>
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel>
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | ListDecimalFieldRefInput<$PrismaModel> | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type NestedEnumTradeTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.TradeType | EnumTradeTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TradeType[] | ListEnumTradeTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TradeType[] | ListEnumTradeTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTradeTypeFilter<$PrismaModel> | $Enums.TradeType
  }

  export type NestedBigIntFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntFilter<$PrismaModel> | bigint | number
  }

  export type NestedEnumTradeTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TradeType | EnumTradeTypeFieldRefInput<$PrismaModel>
    in?: $Enums.TradeType[] | ListEnumTradeTypeFieldRefInput<$PrismaModel>
    notIn?: $Enums.TradeType[] | ListEnumTradeTypeFieldRefInput<$PrismaModel>
    not?: NestedEnumTradeTypeWithAggregatesFilter<$PrismaModel> | $Enums.TradeType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTradeTypeFilter<$PrismaModel>
    _max?: NestedEnumTradeTypeFilter<$PrismaModel>
  }

  export type NestedBigIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel>
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntWithAggregatesFilter<$PrismaModel> | bigint | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedBigIntFilter<$PrismaModel>
    _min?: NestedBigIntFilter<$PrismaModel>
    _max?: NestedBigIntFilter<$PrismaModel>
  }

  export type NestedEnumTimeframeFilter<$PrismaModel = never> = {
    equals?: $Enums.Timeframe | EnumTimeframeFieldRefInput<$PrismaModel>
    in?: $Enums.Timeframe[] | ListEnumTimeframeFieldRefInput<$PrismaModel>
    notIn?: $Enums.Timeframe[] | ListEnumTimeframeFieldRefInput<$PrismaModel>
    not?: NestedEnumTimeframeFilter<$PrismaModel> | $Enums.Timeframe
  }

  export type NestedEnumTimeframeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.Timeframe | EnumTimeframeFieldRefInput<$PrismaModel>
    in?: $Enums.Timeframe[] | ListEnumTimeframeFieldRefInput<$PrismaModel>
    notIn?: $Enums.Timeframe[] | ListEnumTimeframeFieldRefInput<$PrismaModel>
    not?: NestedEnumTimeframeWithAggregatesFilter<$PrismaModel> | $Enums.Timeframe
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTimeframeFilter<$PrismaModel>
    _max?: NestedEnumTimeframeFilter<$PrismaModel>
  }

  export type NestedEnumAuditActionFilter<$PrismaModel = never> = {
    equals?: $Enums.AuditAction | EnumAuditActionFieldRefInput<$PrismaModel>
    in?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    not?: NestedEnumAuditActionFilter<$PrismaModel> | $Enums.AuditAction
  }

  export type NestedEnumAuditActionWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AuditAction | EnumAuditActionFieldRefInput<$PrismaModel>
    in?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    notIn?: $Enums.AuditAction[] | ListEnumAuditActionFieldRefInput<$PrismaModel>
    not?: NestedEnumAuditActionWithAggregatesFilter<$PrismaModel> | $Enums.AuditAction
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAuditActionFilter<$PrismaModel>
    _max?: NestedEnumAuditActionFilter<$PrismaModel>
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string[]
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_contains?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    lt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    lte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gt?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    gte?: InputJsonValue | JsonFieldRefInput<$PrismaModel>
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedEnumTxStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.TxStatus | EnumTxStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TxStatus[] | ListEnumTxStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TxStatus[] | ListEnumTxStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTxStatusFilter<$PrismaModel> | $Enums.TxStatus
  }

  export type NestedBytesNullableFilter<$PrismaModel = never> = {
    equals?: Bytes | BytesFieldRefInput<$PrismaModel> | null
    in?: Bytes[] | ListBytesFieldRefInput<$PrismaModel> | null
    notIn?: Bytes[] | ListBytesFieldRefInput<$PrismaModel> | null
    not?: NestedBytesNullableFilter<$PrismaModel> | Bytes | null
  }

  export type NestedBigIntNullableFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableFilter<$PrismaModel> | bigint | number | null
  }

  export type NestedEnumTxStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TxStatus | EnumTxStatusFieldRefInput<$PrismaModel>
    in?: $Enums.TxStatus[] | ListEnumTxStatusFieldRefInput<$PrismaModel>
    notIn?: $Enums.TxStatus[] | ListEnumTxStatusFieldRefInput<$PrismaModel>
    not?: NestedEnumTxStatusWithAggregatesFilter<$PrismaModel> | $Enums.TxStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTxStatusFilter<$PrismaModel>
    _max?: NestedEnumTxStatusFilter<$PrismaModel>
  }

  export type NestedBytesNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Bytes | BytesFieldRefInput<$PrismaModel> | null
    in?: Bytes[] | ListBytesFieldRefInput<$PrismaModel> | null
    notIn?: Bytes[] | ListBytesFieldRefInput<$PrismaModel> | null
    not?: NestedBytesNullableWithAggregatesFilter<$PrismaModel> | Bytes | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedBytesNullableFilter<$PrismaModel>
    _max?: NestedBytesNullableFilter<$PrismaModel>
  }

  export type NestedBigIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: bigint | number | BigIntFieldRefInput<$PrismaModel> | null
    in?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    notIn?: bigint[] | number[] | ListBigIntFieldRefInput<$PrismaModel> | null
    lt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    lte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gt?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    gte?: bigint | number | BigIntFieldRefInput<$PrismaModel>
    not?: NestedBigIntNullableWithAggregatesFilter<$PrismaModel> | bigint | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedBigIntNullableFilter<$PrismaModel>
    _min?: NestedBigIntNullableFilter<$PrismaModel>
    _max?: NestedBigIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    notIn?: number[] | ListFloatFieldRefInput<$PrismaModel> | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type CoinCreateWithoutCreatorInput = {
    id?: string
    mintAddress: string
    name: string
    symbol: string
    description: string
    imageUri: string
    metadataUri?: string | null
    status?: $Enums.CoinStatus
    version?: number
    virtualSolReserves: Decimal | DecimalJsLike | number | string
    virtualTokenReserves: Decimal | DecimalJsLike | number | string
    realSolReserves?: Decimal | DecimalJsLike | number | string
    realTokenReserves: Decimal | DecimalJsLike | number | string
    totalFeesCollected?: Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerWallet?: string | null
    graduationInitiatedAt?: Date | string | null
    graduationCompletedAt?: Date | string | null
    raydiumPoolAddress?: string | null
    lpMintAddress?: string | null
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionCreateNestedManyWithoutCoinInput
    holdings?: HoldingCreateNestedManyWithoutCoinInput
    candles?: CandleCreateNestedManyWithoutCoinInput
  }

  export type CoinUncheckedCreateWithoutCreatorInput = {
    id?: string
    mintAddress: string
    name: string
    symbol: string
    description: string
    imageUri: string
    metadataUri?: string | null
    status?: $Enums.CoinStatus
    version?: number
    virtualSolReserves: Decimal | DecimalJsLike | number | string
    virtualTokenReserves: Decimal | DecimalJsLike | number | string
    realSolReserves?: Decimal | DecimalJsLike | number | string
    realTokenReserves: Decimal | DecimalJsLike | number | string
    totalFeesCollected?: Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerWallet?: string | null
    graduationInitiatedAt?: Date | string | null
    graduationCompletedAt?: Date | string | null
    raydiumPoolAddress?: string | null
    lpMintAddress?: string | null
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutCoinInput
    holdings?: HoldingUncheckedCreateNestedManyWithoutCoinInput
    candles?: CandleUncheckedCreateNestedManyWithoutCoinInput
  }

  export type CoinCreateOrConnectWithoutCreatorInput = {
    where: CoinWhereUniqueInput
    create: XOR<CoinCreateWithoutCreatorInput, CoinUncheckedCreateWithoutCreatorInput>
  }

  export type CoinCreateManyCreatorInputEnvelope = {
    data: CoinCreateManyCreatorInput | CoinCreateManyCreatorInput[]
    skipDuplicates?: boolean
  }

  export type TransactionCreateWithoutProfileInput = {
    id?: string
    tradeType: $Enums.TradeType
    txSignature: string
    slot: bigint | number
    solAmount: Decimal | DecimalJsLike | number | string
    tokenAmount: Decimal | DecimalJsLike | number | string
    pricePerToken: Decimal | DecimalJsLike | number | string
    totalFee: Decimal | DecimalJsLike | number | string
    creatorFee: Decimal | DecimalJsLike | number | string
    referrerFee?: Decimal | DecimalJsLike | number | string
    treasuryFee: Decimal | DecimalJsLike | number | string
    virtualSolAfter: Decimal | DecimalJsLike | number | string
    virtualTokensAfter: Decimal | DecimalJsLike | number | string
    confirmedAt: Date | string
    createdAt?: Date | string
    coin: CoinCreateNestedOneWithoutTransactionsInput
  }

  export type TransactionUncheckedCreateWithoutProfileInput = {
    id?: string
    coinId: string
    tradeType: $Enums.TradeType
    txSignature: string
    slot: bigint | number
    solAmount: Decimal | DecimalJsLike | number | string
    tokenAmount: Decimal | DecimalJsLike | number | string
    pricePerToken: Decimal | DecimalJsLike | number | string
    totalFee: Decimal | DecimalJsLike | number | string
    creatorFee: Decimal | DecimalJsLike | number | string
    referrerFee?: Decimal | DecimalJsLike | number | string
    treasuryFee: Decimal | DecimalJsLike | number | string
    virtualSolAfter: Decimal | DecimalJsLike | number | string
    virtualTokensAfter: Decimal | DecimalJsLike | number | string
    confirmedAt: Date | string
    createdAt?: Date | string
  }

  export type TransactionCreateOrConnectWithoutProfileInput = {
    where: TransactionWhereUniqueInput
    create: XOR<TransactionCreateWithoutProfileInput, TransactionUncheckedCreateWithoutProfileInput>
  }

  export type TransactionCreateManyProfileInputEnvelope = {
    data: TransactionCreateManyProfileInput | TransactionCreateManyProfileInput[]
    skipDuplicates?: boolean
  }

  export type HoldingCreateWithoutProfileInput = {
    id?: string
    tokenBalance: Decimal | DecimalJsLike | number | string
    costBasisSol?: Decimal | DecimalJsLike | number | string
    totalBought?: Decimal | DecimalJsLike | number | string
    totalSold?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
    coin: CoinCreateNestedOneWithoutHoldingsInput
  }

  export type HoldingUncheckedCreateWithoutProfileInput = {
    id?: string
    coinId: string
    tokenBalance: Decimal | DecimalJsLike | number | string
    costBasisSol?: Decimal | DecimalJsLike | number | string
    totalBought?: Decimal | DecimalJsLike | number | string
    totalSold?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type HoldingCreateOrConnectWithoutProfileInput = {
    where: HoldingWhereUniqueInput
    create: XOR<HoldingCreateWithoutProfileInput, HoldingUncheckedCreateWithoutProfileInput>
  }

  export type HoldingCreateManyProfileInputEnvelope = {
    data: HoldingCreateManyProfileInput | HoldingCreateManyProfileInput[]
    skipDuplicates?: boolean
  }

  export type CoinUpsertWithWhereUniqueWithoutCreatorInput = {
    where: CoinWhereUniqueInput
    update: XOR<CoinUpdateWithoutCreatorInput, CoinUncheckedUpdateWithoutCreatorInput>
    create: XOR<CoinCreateWithoutCreatorInput, CoinUncheckedCreateWithoutCreatorInput>
  }

  export type CoinUpdateWithWhereUniqueWithoutCreatorInput = {
    where: CoinWhereUniqueInput
    data: XOR<CoinUpdateWithoutCreatorInput, CoinUncheckedUpdateWithoutCreatorInput>
  }

  export type CoinUpdateManyWithWhereWithoutCreatorInput = {
    where: CoinScalarWhereInput
    data: XOR<CoinUpdateManyMutationInput, CoinUncheckedUpdateManyWithoutCreatorInput>
  }

  export type CoinScalarWhereInput = {
    AND?: CoinScalarWhereInput | CoinScalarWhereInput[]
    OR?: CoinScalarWhereInput[]
    NOT?: CoinScalarWhereInput | CoinScalarWhereInput[]
    id?: StringFilter<"Coin"> | string
    mintAddress?: StringFilter<"Coin"> | string
    creatorWallet?: StringFilter<"Coin"> | string
    name?: StringFilter<"Coin"> | string
    symbol?: StringFilter<"Coin"> | string
    description?: StringFilter<"Coin"> | string
    imageUri?: StringFilter<"Coin"> | string
    metadataUri?: StringNullableFilter<"Coin"> | string | null
    status?: EnumCoinStatusFilter<"Coin"> | $Enums.CoinStatus
    version?: IntFilter<"Coin"> | number
    virtualSolReserves?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFilter<"Coin"> | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: DecimalNullableFilter<"Coin"> | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: DecimalNullableFilter<"Coin"> | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: StringNullableFilter<"Coin"> | string | null
    graduationInitiatedAt?: DateTimeNullableFilter<"Coin"> | Date | string | null
    graduationCompletedAt?: DateTimeNullableFilter<"Coin"> | Date | string | null
    raydiumPoolAddress?: StringNullableFilter<"Coin"> | string | null
    lpMintAddress?: StringNullableFilter<"Coin"> | string | null
    lpTokensBurned?: BoolFilter<"Coin"> | boolean
    mintAuthorityRevoked?: BoolFilter<"Coin"> | boolean
    freezeAuthorityRevoked?: BoolFilter<"Coin"> | boolean
    createdAt?: DateTimeFilter<"Coin"> | Date | string
    updatedAt?: DateTimeFilter<"Coin"> | Date | string
  }

  export type TransactionUpsertWithWhereUniqueWithoutProfileInput = {
    where: TransactionWhereUniqueInput
    update: XOR<TransactionUpdateWithoutProfileInput, TransactionUncheckedUpdateWithoutProfileInput>
    create: XOR<TransactionCreateWithoutProfileInput, TransactionUncheckedCreateWithoutProfileInput>
  }

  export type TransactionUpdateWithWhereUniqueWithoutProfileInput = {
    where: TransactionWhereUniqueInput
    data: XOR<TransactionUpdateWithoutProfileInput, TransactionUncheckedUpdateWithoutProfileInput>
  }

  export type TransactionUpdateManyWithWhereWithoutProfileInput = {
    where: TransactionScalarWhereInput
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyWithoutProfileInput>
  }

  export type TransactionScalarWhereInput = {
    AND?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
    OR?: TransactionScalarWhereInput[]
    NOT?: TransactionScalarWhereInput | TransactionScalarWhereInput[]
    id?: StringFilter<"Transaction"> | string
    coinId?: StringFilter<"Transaction"> | string
    walletAddress?: StringFilter<"Transaction"> | string
    tradeType?: EnumTradeTypeFilter<"Transaction"> | $Enums.TradeType
    txSignature?: StringFilter<"Transaction"> | string
    slot?: BigIntFilter<"Transaction"> | bigint | number
    solAmount?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    tokenAmount?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    pricePerToken?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    totalFee?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    creatorFee?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    referrerFee?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    treasuryFee?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    virtualSolAfter?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    virtualTokensAfter?: DecimalFilter<"Transaction"> | Decimal | DecimalJsLike | number | string
    confirmedAt?: DateTimeFilter<"Transaction"> | Date | string
    createdAt?: DateTimeFilter<"Transaction"> | Date | string
  }

  export type HoldingUpsertWithWhereUniqueWithoutProfileInput = {
    where: HoldingWhereUniqueInput
    update: XOR<HoldingUpdateWithoutProfileInput, HoldingUncheckedUpdateWithoutProfileInput>
    create: XOR<HoldingCreateWithoutProfileInput, HoldingUncheckedCreateWithoutProfileInput>
  }

  export type HoldingUpdateWithWhereUniqueWithoutProfileInput = {
    where: HoldingWhereUniqueInput
    data: XOR<HoldingUpdateWithoutProfileInput, HoldingUncheckedUpdateWithoutProfileInput>
  }

  export type HoldingUpdateManyWithWhereWithoutProfileInput = {
    where: HoldingScalarWhereInput
    data: XOR<HoldingUpdateManyMutationInput, HoldingUncheckedUpdateManyWithoutProfileInput>
  }

  export type HoldingScalarWhereInput = {
    AND?: HoldingScalarWhereInput | HoldingScalarWhereInput[]
    OR?: HoldingScalarWhereInput[]
    NOT?: HoldingScalarWhereInput | HoldingScalarWhereInput[]
    id?: StringFilter<"Holding"> | string
    walletAddress?: StringFilter<"Holding"> | string
    coinId?: StringFilter<"Holding"> | string
    tokenBalance?: DecimalFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    costBasisSol?: DecimalFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    totalBought?: DecimalFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    totalSold?: DecimalFilter<"Holding"> | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFilter<"Holding"> | Date | string
  }

  export type ProfileCreateWithoutCoinsInput = {
    id?: string
    walletAddress: string
    privyUserId: string
    role?: $Enums.UserRole
    referrerWallet?: string | null
    encryptedMnemonic?: string | null
    mnemonicIv?: string | null
    mnemonicTag?: string | null
    isBanned?: boolean
    runBalanceSol?: Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: Decimal | DecimalJsLike | number | string
    referralRewardsSol?: Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSeenAt?: Date | string | null
    transactions?: TransactionCreateNestedManyWithoutProfileInput
    holdings?: HoldingCreateNestedManyWithoutProfileInput
  }

  export type ProfileUncheckedCreateWithoutCoinsInput = {
    id?: string
    walletAddress: string
    privyUserId: string
    role?: $Enums.UserRole
    referrerWallet?: string | null
    encryptedMnemonic?: string | null
    mnemonicIv?: string | null
    mnemonicTag?: string | null
    isBanned?: boolean
    runBalanceSol?: Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: Decimal | DecimalJsLike | number | string
    referralRewardsSol?: Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSeenAt?: Date | string | null
    transactions?: TransactionUncheckedCreateNestedManyWithoutProfileInput
    holdings?: HoldingUncheckedCreateNestedManyWithoutProfileInput
  }

  export type ProfileCreateOrConnectWithoutCoinsInput = {
    where: ProfileWhereUniqueInput
    create: XOR<ProfileCreateWithoutCoinsInput, ProfileUncheckedCreateWithoutCoinsInput>
  }

  export type TransactionCreateWithoutCoinInput = {
    id?: string
    tradeType: $Enums.TradeType
    txSignature: string
    slot: bigint | number
    solAmount: Decimal | DecimalJsLike | number | string
    tokenAmount: Decimal | DecimalJsLike | number | string
    pricePerToken: Decimal | DecimalJsLike | number | string
    totalFee: Decimal | DecimalJsLike | number | string
    creatorFee: Decimal | DecimalJsLike | number | string
    referrerFee?: Decimal | DecimalJsLike | number | string
    treasuryFee: Decimal | DecimalJsLike | number | string
    virtualSolAfter: Decimal | DecimalJsLike | number | string
    virtualTokensAfter: Decimal | DecimalJsLike | number | string
    confirmedAt: Date | string
    createdAt?: Date | string
    profile: ProfileCreateNestedOneWithoutTransactionsInput
  }

  export type TransactionUncheckedCreateWithoutCoinInput = {
    id?: string
    walletAddress: string
    tradeType: $Enums.TradeType
    txSignature: string
    slot: bigint | number
    solAmount: Decimal | DecimalJsLike | number | string
    tokenAmount: Decimal | DecimalJsLike | number | string
    pricePerToken: Decimal | DecimalJsLike | number | string
    totalFee: Decimal | DecimalJsLike | number | string
    creatorFee: Decimal | DecimalJsLike | number | string
    referrerFee?: Decimal | DecimalJsLike | number | string
    treasuryFee: Decimal | DecimalJsLike | number | string
    virtualSolAfter: Decimal | DecimalJsLike | number | string
    virtualTokensAfter: Decimal | DecimalJsLike | number | string
    confirmedAt: Date | string
    createdAt?: Date | string
  }

  export type TransactionCreateOrConnectWithoutCoinInput = {
    where: TransactionWhereUniqueInput
    create: XOR<TransactionCreateWithoutCoinInput, TransactionUncheckedCreateWithoutCoinInput>
  }

  export type TransactionCreateManyCoinInputEnvelope = {
    data: TransactionCreateManyCoinInput | TransactionCreateManyCoinInput[]
    skipDuplicates?: boolean
  }

  export type HoldingCreateWithoutCoinInput = {
    id?: string
    tokenBalance: Decimal | DecimalJsLike | number | string
    costBasisSol?: Decimal | DecimalJsLike | number | string
    totalBought?: Decimal | DecimalJsLike | number | string
    totalSold?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
    profile: ProfileCreateNestedOneWithoutHoldingsInput
  }

  export type HoldingUncheckedCreateWithoutCoinInput = {
    id?: string
    walletAddress: string
    tokenBalance: Decimal | DecimalJsLike | number | string
    costBasisSol?: Decimal | DecimalJsLike | number | string
    totalBought?: Decimal | DecimalJsLike | number | string
    totalSold?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type HoldingCreateOrConnectWithoutCoinInput = {
    where: HoldingWhereUniqueInput
    create: XOR<HoldingCreateWithoutCoinInput, HoldingUncheckedCreateWithoutCoinInput>
  }

  export type HoldingCreateManyCoinInputEnvelope = {
    data: HoldingCreateManyCoinInput | HoldingCreateManyCoinInput[]
    skipDuplicates?: boolean
  }

  export type CandleCreateWithoutCoinInput = {
    id?: string
    timeframe: $Enums.Timeframe
    openTime: bigint | number
    open: Decimal | DecimalJsLike | number | string
    high: Decimal | DecimalJsLike | number | string
    low: Decimal | DecimalJsLike | number | string
    close: Decimal | DecimalJsLike | number | string
    volume: Decimal | DecimalJsLike | number | string
    trades?: number
    updatedAt?: Date | string
  }

  export type CandleUncheckedCreateWithoutCoinInput = {
    id?: string
    timeframe: $Enums.Timeframe
    openTime: bigint | number
    open: Decimal | DecimalJsLike | number | string
    high: Decimal | DecimalJsLike | number | string
    low: Decimal | DecimalJsLike | number | string
    close: Decimal | DecimalJsLike | number | string
    volume: Decimal | DecimalJsLike | number | string
    trades?: number
    updatedAt?: Date | string
  }

  export type CandleCreateOrConnectWithoutCoinInput = {
    where: CandleWhereUniqueInput
    create: XOR<CandleCreateWithoutCoinInput, CandleUncheckedCreateWithoutCoinInput>
  }

  export type CandleCreateManyCoinInputEnvelope = {
    data: CandleCreateManyCoinInput | CandleCreateManyCoinInput[]
    skipDuplicates?: boolean
  }

  export type ProfileUpsertWithoutCoinsInput = {
    update: XOR<ProfileUpdateWithoutCoinsInput, ProfileUncheckedUpdateWithoutCoinsInput>
    create: XOR<ProfileCreateWithoutCoinsInput, ProfileUncheckedCreateWithoutCoinsInput>
    where?: ProfileWhereInput
  }

  export type ProfileUpdateToOneWithWhereWithoutCoinsInput = {
    where?: ProfileWhereInput
    data: XOR<ProfileUpdateWithoutCoinsInput, ProfileUncheckedUpdateWithoutCoinsInput>
  }

  export type ProfileUpdateWithoutCoinsInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    privyUserId?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    encryptedMnemonic?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicIv?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicTag?: NullableStringFieldUpdateOperationsInput | string | null
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    runBalanceSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referralRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    transactions?: TransactionUpdateManyWithoutProfileNestedInput
    holdings?: HoldingUpdateManyWithoutProfileNestedInput
  }

  export type ProfileUncheckedUpdateWithoutCoinsInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    privyUserId?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    encryptedMnemonic?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicIv?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicTag?: NullableStringFieldUpdateOperationsInput | string | null
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    runBalanceSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referralRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    transactions?: TransactionUncheckedUpdateManyWithoutProfileNestedInput
    holdings?: HoldingUncheckedUpdateManyWithoutProfileNestedInput
  }

  export type TransactionUpsertWithWhereUniqueWithoutCoinInput = {
    where: TransactionWhereUniqueInput
    update: XOR<TransactionUpdateWithoutCoinInput, TransactionUncheckedUpdateWithoutCoinInput>
    create: XOR<TransactionCreateWithoutCoinInput, TransactionUncheckedCreateWithoutCoinInput>
  }

  export type TransactionUpdateWithWhereUniqueWithoutCoinInput = {
    where: TransactionWhereUniqueInput
    data: XOR<TransactionUpdateWithoutCoinInput, TransactionUncheckedUpdateWithoutCoinInput>
  }

  export type TransactionUpdateManyWithWhereWithoutCoinInput = {
    where: TransactionScalarWhereInput
    data: XOR<TransactionUpdateManyMutationInput, TransactionUncheckedUpdateManyWithoutCoinInput>
  }

  export type HoldingUpsertWithWhereUniqueWithoutCoinInput = {
    where: HoldingWhereUniqueInput
    update: XOR<HoldingUpdateWithoutCoinInput, HoldingUncheckedUpdateWithoutCoinInput>
    create: XOR<HoldingCreateWithoutCoinInput, HoldingUncheckedCreateWithoutCoinInput>
  }

  export type HoldingUpdateWithWhereUniqueWithoutCoinInput = {
    where: HoldingWhereUniqueInput
    data: XOR<HoldingUpdateWithoutCoinInput, HoldingUncheckedUpdateWithoutCoinInput>
  }

  export type HoldingUpdateManyWithWhereWithoutCoinInput = {
    where: HoldingScalarWhereInput
    data: XOR<HoldingUpdateManyMutationInput, HoldingUncheckedUpdateManyWithoutCoinInput>
  }

  export type CandleUpsertWithWhereUniqueWithoutCoinInput = {
    where: CandleWhereUniqueInput
    update: XOR<CandleUpdateWithoutCoinInput, CandleUncheckedUpdateWithoutCoinInput>
    create: XOR<CandleCreateWithoutCoinInput, CandleUncheckedCreateWithoutCoinInput>
  }

  export type CandleUpdateWithWhereUniqueWithoutCoinInput = {
    where: CandleWhereUniqueInput
    data: XOR<CandleUpdateWithoutCoinInput, CandleUncheckedUpdateWithoutCoinInput>
  }

  export type CandleUpdateManyWithWhereWithoutCoinInput = {
    where: CandleScalarWhereInput
    data: XOR<CandleUpdateManyMutationInput, CandleUncheckedUpdateManyWithoutCoinInput>
  }

  export type CandleScalarWhereInput = {
    AND?: CandleScalarWhereInput | CandleScalarWhereInput[]
    OR?: CandleScalarWhereInput[]
    NOT?: CandleScalarWhereInput | CandleScalarWhereInput[]
    id?: StringFilter<"Candle"> | string
    coinId?: StringFilter<"Candle"> | string
    timeframe?: EnumTimeframeFilter<"Candle"> | $Enums.Timeframe
    openTime?: BigIntFilter<"Candle"> | bigint | number
    open?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    high?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    low?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    close?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    volume?: DecimalFilter<"Candle"> | Decimal | DecimalJsLike | number | string
    trades?: IntFilter<"Candle"> | number
    updatedAt?: DateTimeFilter<"Candle"> | Date | string
  }

  export type ProfileCreateWithoutHoldingsInput = {
    id?: string
    walletAddress: string
    privyUserId: string
    role?: $Enums.UserRole
    referrerWallet?: string | null
    encryptedMnemonic?: string | null
    mnemonicIv?: string | null
    mnemonicTag?: string | null
    isBanned?: boolean
    runBalanceSol?: Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: Decimal | DecimalJsLike | number | string
    referralRewardsSol?: Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSeenAt?: Date | string | null
    coins?: CoinCreateNestedManyWithoutCreatorInput
    transactions?: TransactionCreateNestedManyWithoutProfileInput
  }

  export type ProfileUncheckedCreateWithoutHoldingsInput = {
    id?: string
    walletAddress: string
    privyUserId: string
    role?: $Enums.UserRole
    referrerWallet?: string | null
    encryptedMnemonic?: string | null
    mnemonicIv?: string | null
    mnemonicTag?: string | null
    isBanned?: boolean
    runBalanceSol?: Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: Decimal | DecimalJsLike | number | string
    referralRewardsSol?: Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSeenAt?: Date | string | null
    coins?: CoinUncheckedCreateNestedManyWithoutCreatorInput
    transactions?: TransactionUncheckedCreateNestedManyWithoutProfileInput
  }

  export type ProfileCreateOrConnectWithoutHoldingsInput = {
    where: ProfileWhereUniqueInput
    create: XOR<ProfileCreateWithoutHoldingsInput, ProfileUncheckedCreateWithoutHoldingsInput>
  }

  export type CoinCreateWithoutHoldingsInput = {
    id?: string
    mintAddress: string
    name: string
    symbol: string
    description: string
    imageUri: string
    metadataUri?: string | null
    status?: $Enums.CoinStatus
    version?: number
    virtualSolReserves: Decimal | DecimalJsLike | number | string
    virtualTokenReserves: Decimal | DecimalJsLike | number | string
    realSolReserves?: Decimal | DecimalJsLike | number | string
    realTokenReserves: Decimal | DecimalJsLike | number | string
    totalFeesCollected?: Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerWallet?: string | null
    graduationInitiatedAt?: Date | string | null
    graduationCompletedAt?: Date | string | null
    raydiumPoolAddress?: string | null
    lpMintAddress?: string | null
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    creator: ProfileCreateNestedOneWithoutCoinsInput
    transactions?: TransactionCreateNestedManyWithoutCoinInput
    candles?: CandleCreateNestedManyWithoutCoinInput
  }

  export type CoinUncheckedCreateWithoutHoldingsInput = {
    id?: string
    mintAddress: string
    creatorWallet: string
    name: string
    symbol: string
    description: string
    imageUri: string
    metadataUri?: string | null
    status?: $Enums.CoinStatus
    version?: number
    virtualSolReserves: Decimal | DecimalJsLike | number | string
    virtualTokenReserves: Decimal | DecimalJsLike | number | string
    realSolReserves?: Decimal | DecimalJsLike | number | string
    realTokenReserves: Decimal | DecimalJsLike | number | string
    totalFeesCollected?: Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerWallet?: string | null
    graduationInitiatedAt?: Date | string | null
    graduationCompletedAt?: Date | string | null
    raydiumPoolAddress?: string | null
    lpMintAddress?: string | null
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutCoinInput
    candles?: CandleUncheckedCreateNestedManyWithoutCoinInput
  }

  export type CoinCreateOrConnectWithoutHoldingsInput = {
    where: CoinWhereUniqueInput
    create: XOR<CoinCreateWithoutHoldingsInput, CoinUncheckedCreateWithoutHoldingsInput>
  }

  export type ProfileUpsertWithoutHoldingsInput = {
    update: XOR<ProfileUpdateWithoutHoldingsInput, ProfileUncheckedUpdateWithoutHoldingsInput>
    create: XOR<ProfileCreateWithoutHoldingsInput, ProfileUncheckedCreateWithoutHoldingsInput>
    where?: ProfileWhereInput
  }

  export type ProfileUpdateToOneWithWhereWithoutHoldingsInput = {
    where?: ProfileWhereInput
    data: XOR<ProfileUpdateWithoutHoldingsInput, ProfileUncheckedUpdateWithoutHoldingsInput>
  }

  export type ProfileUpdateWithoutHoldingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    privyUserId?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    encryptedMnemonic?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicIv?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicTag?: NullableStringFieldUpdateOperationsInput | string | null
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    runBalanceSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referralRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    coins?: CoinUpdateManyWithoutCreatorNestedInput
    transactions?: TransactionUpdateManyWithoutProfileNestedInput
  }

  export type ProfileUncheckedUpdateWithoutHoldingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    privyUserId?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    encryptedMnemonic?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicIv?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicTag?: NullableStringFieldUpdateOperationsInput | string | null
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    runBalanceSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referralRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    coins?: CoinUncheckedUpdateManyWithoutCreatorNestedInput
    transactions?: TransactionUncheckedUpdateManyWithoutProfileNestedInput
  }

  export type CoinUpsertWithoutHoldingsInput = {
    update: XOR<CoinUpdateWithoutHoldingsInput, CoinUncheckedUpdateWithoutHoldingsInput>
    create: XOR<CoinCreateWithoutHoldingsInput, CoinUncheckedCreateWithoutHoldingsInput>
    where?: CoinWhereInput
  }

  export type CoinUpdateToOneWithWhereWithoutHoldingsInput = {
    where?: CoinWhereInput
    data: XOR<CoinUpdateWithoutHoldingsInput, CoinUncheckedUpdateWithoutHoldingsInput>
  }

  export type CoinUpdateWithoutHoldingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    mintAddress?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    imageUri?: StringFieldUpdateOperationsInput | string
    metadataUri?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCoinStatusFieldUpdateOperationsInput | $Enums.CoinStatus
    version?: IntFieldUpdateOperationsInput | number
    virtualSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    graduationInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    graduationCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    raydiumPoolAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpMintAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpTokensBurned?: BoolFieldUpdateOperationsInput | boolean
    mintAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    freezeAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: ProfileUpdateOneRequiredWithoutCoinsNestedInput
    transactions?: TransactionUpdateManyWithoutCoinNestedInput
    candles?: CandleUpdateManyWithoutCoinNestedInput
  }

  export type CoinUncheckedUpdateWithoutHoldingsInput = {
    id?: StringFieldUpdateOperationsInput | string
    mintAddress?: StringFieldUpdateOperationsInput | string
    creatorWallet?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    imageUri?: StringFieldUpdateOperationsInput | string
    metadataUri?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCoinStatusFieldUpdateOperationsInput | $Enums.CoinStatus
    version?: IntFieldUpdateOperationsInput | number
    virtualSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    graduationInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    graduationCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    raydiumPoolAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpMintAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpTokensBurned?: BoolFieldUpdateOperationsInput | boolean
    mintAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    freezeAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutCoinNestedInput
    candles?: CandleUncheckedUpdateManyWithoutCoinNestedInput
  }

  export type CoinCreateWithoutTransactionsInput = {
    id?: string
    mintAddress: string
    name: string
    symbol: string
    description: string
    imageUri: string
    metadataUri?: string | null
    status?: $Enums.CoinStatus
    version?: number
    virtualSolReserves: Decimal | DecimalJsLike | number | string
    virtualTokenReserves: Decimal | DecimalJsLike | number | string
    realSolReserves?: Decimal | DecimalJsLike | number | string
    realTokenReserves: Decimal | DecimalJsLike | number | string
    totalFeesCollected?: Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerWallet?: string | null
    graduationInitiatedAt?: Date | string | null
    graduationCompletedAt?: Date | string | null
    raydiumPoolAddress?: string | null
    lpMintAddress?: string | null
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    creator: ProfileCreateNestedOneWithoutCoinsInput
    holdings?: HoldingCreateNestedManyWithoutCoinInput
    candles?: CandleCreateNestedManyWithoutCoinInput
  }

  export type CoinUncheckedCreateWithoutTransactionsInput = {
    id?: string
    mintAddress: string
    creatorWallet: string
    name: string
    symbol: string
    description: string
    imageUri: string
    metadataUri?: string | null
    status?: $Enums.CoinStatus
    version?: number
    virtualSolReserves: Decimal | DecimalJsLike | number | string
    virtualTokenReserves: Decimal | DecimalJsLike | number | string
    realSolReserves?: Decimal | DecimalJsLike | number | string
    realTokenReserves: Decimal | DecimalJsLike | number | string
    totalFeesCollected?: Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerWallet?: string | null
    graduationInitiatedAt?: Date | string | null
    graduationCompletedAt?: Date | string | null
    raydiumPoolAddress?: string | null
    lpMintAddress?: string | null
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    holdings?: HoldingUncheckedCreateNestedManyWithoutCoinInput
    candles?: CandleUncheckedCreateNestedManyWithoutCoinInput
  }

  export type CoinCreateOrConnectWithoutTransactionsInput = {
    where: CoinWhereUniqueInput
    create: XOR<CoinCreateWithoutTransactionsInput, CoinUncheckedCreateWithoutTransactionsInput>
  }

  export type ProfileCreateWithoutTransactionsInput = {
    id?: string
    walletAddress: string
    privyUserId: string
    role?: $Enums.UserRole
    referrerWallet?: string | null
    encryptedMnemonic?: string | null
    mnemonicIv?: string | null
    mnemonicTag?: string | null
    isBanned?: boolean
    runBalanceSol?: Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: Decimal | DecimalJsLike | number | string
    referralRewardsSol?: Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSeenAt?: Date | string | null
    coins?: CoinCreateNestedManyWithoutCreatorInput
    holdings?: HoldingCreateNestedManyWithoutProfileInput
  }

  export type ProfileUncheckedCreateWithoutTransactionsInput = {
    id?: string
    walletAddress: string
    privyUserId: string
    role?: $Enums.UserRole
    referrerWallet?: string | null
    encryptedMnemonic?: string | null
    mnemonicIv?: string | null
    mnemonicTag?: string | null
    isBanned?: boolean
    runBalanceSol?: Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: Decimal | DecimalJsLike | number | string
    referralRewardsSol?: Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: Decimal | DecimalJsLike | number | string
    createdAt?: Date | string
    updatedAt?: Date | string
    lastSeenAt?: Date | string | null
    coins?: CoinUncheckedCreateNestedManyWithoutCreatorInput
    holdings?: HoldingUncheckedCreateNestedManyWithoutProfileInput
  }

  export type ProfileCreateOrConnectWithoutTransactionsInput = {
    where: ProfileWhereUniqueInput
    create: XOR<ProfileCreateWithoutTransactionsInput, ProfileUncheckedCreateWithoutTransactionsInput>
  }

  export type CoinUpsertWithoutTransactionsInput = {
    update: XOR<CoinUpdateWithoutTransactionsInput, CoinUncheckedUpdateWithoutTransactionsInput>
    create: XOR<CoinCreateWithoutTransactionsInput, CoinUncheckedCreateWithoutTransactionsInput>
    where?: CoinWhereInput
  }

  export type CoinUpdateToOneWithWhereWithoutTransactionsInput = {
    where?: CoinWhereInput
    data: XOR<CoinUpdateWithoutTransactionsInput, CoinUncheckedUpdateWithoutTransactionsInput>
  }

  export type CoinUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    mintAddress?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    imageUri?: StringFieldUpdateOperationsInput | string
    metadataUri?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCoinStatusFieldUpdateOperationsInput | $Enums.CoinStatus
    version?: IntFieldUpdateOperationsInput | number
    virtualSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    graduationInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    graduationCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    raydiumPoolAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpMintAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpTokensBurned?: BoolFieldUpdateOperationsInput | boolean
    mintAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    freezeAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: ProfileUpdateOneRequiredWithoutCoinsNestedInput
    holdings?: HoldingUpdateManyWithoutCoinNestedInput
    candles?: CandleUpdateManyWithoutCoinNestedInput
  }

  export type CoinUncheckedUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    mintAddress?: StringFieldUpdateOperationsInput | string
    creatorWallet?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    imageUri?: StringFieldUpdateOperationsInput | string
    metadataUri?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCoinStatusFieldUpdateOperationsInput | $Enums.CoinStatus
    version?: IntFieldUpdateOperationsInput | number
    virtualSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    graduationInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    graduationCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    raydiumPoolAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpMintAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpTokensBurned?: BoolFieldUpdateOperationsInput | boolean
    mintAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    freezeAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    holdings?: HoldingUncheckedUpdateManyWithoutCoinNestedInput
    candles?: CandleUncheckedUpdateManyWithoutCoinNestedInput
  }

  export type ProfileUpsertWithoutTransactionsInput = {
    update: XOR<ProfileUpdateWithoutTransactionsInput, ProfileUncheckedUpdateWithoutTransactionsInput>
    create: XOR<ProfileCreateWithoutTransactionsInput, ProfileUncheckedCreateWithoutTransactionsInput>
    where?: ProfileWhereInput
  }

  export type ProfileUpdateToOneWithWhereWithoutTransactionsInput = {
    where?: ProfileWhereInput
    data: XOR<ProfileUpdateWithoutTransactionsInput, ProfileUncheckedUpdateWithoutTransactionsInput>
  }

  export type ProfileUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    privyUserId?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    encryptedMnemonic?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicIv?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicTag?: NullableStringFieldUpdateOperationsInput | string | null
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    runBalanceSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referralRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    coins?: CoinUpdateManyWithoutCreatorNestedInput
    holdings?: HoldingUpdateManyWithoutProfileNestedInput
  }

  export type ProfileUncheckedUpdateWithoutTransactionsInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    privyUserId?: StringFieldUpdateOperationsInput | string
    role?: EnumUserRoleFieldUpdateOperationsInput | $Enums.UserRole
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    encryptedMnemonic?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicIv?: NullableStringFieldUpdateOperationsInput | string | null
    mnemonicTag?: NullableStringFieldUpdateOperationsInput | string | null
    isBanned?: BoolFieldUpdateOperationsInput | boolean
    runBalanceSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referralRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    ownerRewardsSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    lastSeenAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    coins?: CoinUncheckedUpdateManyWithoutCreatorNestedInput
    holdings?: HoldingUncheckedUpdateManyWithoutProfileNestedInput
  }

  export type CoinCreateWithoutCandlesInput = {
    id?: string
    mintAddress: string
    name: string
    symbol: string
    description: string
    imageUri: string
    metadataUri?: string | null
    status?: $Enums.CoinStatus
    version?: number
    virtualSolReserves: Decimal | DecimalJsLike | number | string
    virtualTokenReserves: Decimal | DecimalJsLike | number | string
    realSolReserves?: Decimal | DecimalJsLike | number | string
    realTokenReserves: Decimal | DecimalJsLike | number | string
    totalFeesCollected?: Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerWallet?: string | null
    graduationInitiatedAt?: Date | string | null
    graduationCompletedAt?: Date | string | null
    raydiumPoolAddress?: string | null
    lpMintAddress?: string | null
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    creator: ProfileCreateNestedOneWithoutCoinsInput
    transactions?: TransactionCreateNestedManyWithoutCoinInput
    holdings?: HoldingCreateNestedManyWithoutCoinInput
  }

  export type CoinUncheckedCreateWithoutCandlesInput = {
    id?: string
    mintAddress: string
    creatorWallet: string
    name: string
    symbol: string
    description: string
    imageUri: string
    metadataUri?: string | null
    status?: $Enums.CoinStatus
    version?: number
    virtualSolReserves: Decimal | DecimalJsLike | number | string
    virtualTokenReserves: Decimal | DecimalJsLike | number | string
    realSolReserves?: Decimal | DecimalJsLike | number | string
    realTokenReserves: Decimal | DecimalJsLike | number | string
    totalFeesCollected?: Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerWallet?: string | null
    graduationInitiatedAt?: Date | string | null
    graduationCompletedAt?: Date | string | null
    raydiumPoolAddress?: string | null
    lpMintAddress?: string | null
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
    transactions?: TransactionUncheckedCreateNestedManyWithoutCoinInput
    holdings?: HoldingUncheckedCreateNestedManyWithoutCoinInput
  }

  export type CoinCreateOrConnectWithoutCandlesInput = {
    where: CoinWhereUniqueInput
    create: XOR<CoinCreateWithoutCandlesInput, CoinUncheckedCreateWithoutCandlesInput>
  }

  export type CoinUpsertWithoutCandlesInput = {
    update: XOR<CoinUpdateWithoutCandlesInput, CoinUncheckedUpdateWithoutCandlesInput>
    create: XOR<CoinCreateWithoutCandlesInput, CoinUncheckedCreateWithoutCandlesInput>
    where?: CoinWhereInput
  }

  export type CoinUpdateToOneWithWhereWithoutCandlesInput = {
    where?: CoinWhereInput
    data: XOR<CoinUpdateWithoutCandlesInput, CoinUncheckedUpdateWithoutCandlesInput>
  }

  export type CoinUpdateWithoutCandlesInput = {
    id?: StringFieldUpdateOperationsInput | string
    mintAddress?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    imageUri?: StringFieldUpdateOperationsInput | string
    metadataUri?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCoinStatusFieldUpdateOperationsInput | $Enums.CoinStatus
    version?: IntFieldUpdateOperationsInput | number
    virtualSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    graduationInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    graduationCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    raydiumPoolAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpMintAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpTokensBurned?: BoolFieldUpdateOperationsInput | boolean
    mintAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    freezeAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    creator?: ProfileUpdateOneRequiredWithoutCoinsNestedInput
    transactions?: TransactionUpdateManyWithoutCoinNestedInput
    holdings?: HoldingUpdateManyWithoutCoinNestedInput
  }

  export type CoinUncheckedUpdateWithoutCandlesInput = {
    id?: StringFieldUpdateOperationsInput | string
    mintAddress?: StringFieldUpdateOperationsInput | string
    creatorWallet?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    imageUri?: StringFieldUpdateOperationsInput | string
    metadataUri?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCoinStatusFieldUpdateOperationsInput | $Enums.CoinStatus
    version?: IntFieldUpdateOperationsInput | number
    virtualSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    graduationInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    graduationCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    raydiumPoolAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpMintAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpTokensBurned?: BoolFieldUpdateOperationsInput | boolean
    mintAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    freezeAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutCoinNestedInput
    holdings?: HoldingUncheckedUpdateManyWithoutCoinNestedInput
  }

  export type CoinCreateManyCreatorInput = {
    id?: string
    mintAddress: string
    name: string
    symbol: string
    description: string
    imageUri: string
    metadataUri?: string | null
    status?: $Enums.CoinStatus
    version?: number
    virtualSolReserves: Decimal | DecimalJsLike | number | string
    virtualTokenReserves: Decimal | DecimalJsLike | number | string
    realSolReserves?: Decimal | DecimalJsLike | number | string
    realTokenReserves: Decimal | DecimalJsLike | number | string
    totalFeesCollected?: Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: Decimal | DecimalJsLike | number | string | null
    referrerWallet?: string | null
    graduationInitiatedAt?: Date | string | null
    graduationCompletedAt?: Date | string | null
    raydiumPoolAddress?: string | null
    lpMintAddress?: string | null
    lpTokensBurned?: boolean
    mintAuthorityRevoked?: boolean
    freezeAuthorityRevoked?: boolean
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type TransactionCreateManyProfileInput = {
    id?: string
    coinId: string
    tradeType: $Enums.TradeType
    txSignature: string
    slot: bigint | number
    solAmount: Decimal | DecimalJsLike | number | string
    tokenAmount: Decimal | DecimalJsLike | number | string
    pricePerToken: Decimal | DecimalJsLike | number | string
    totalFee: Decimal | DecimalJsLike | number | string
    creatorFee: Decimal | DecimalJsLike | number | string
    referrerFee?: Decimal | DecimalJsLike | number | string
    treasuryFee: Decimal | DecimalJsLike | number | string
    virtualSolAfter: Decimal | DecimalJsLike | number | string
    virtualTokensAfter: Decimal | DecimalJsLike | number | string
    confirmedAt: Date | string
    createdAt?: Date | string
  }

  export type HoldingCreateManyProfileInput = {
    id?: string
    coinId: string
    tokenBalance: Decimal | DecimalJsLike | number | string
    costBasisSol?: Decimal | DecimalJsLike | number | string
    totalBought?: Decimal | DecimalJsLike | number | string
    totalSold?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type CoinUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    mintAddress?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    imageUri?: StringFieldUpdateOperationsInput | string
    metadataUri?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCoinStatusFieldUpdateOperationsInput | $Enums.CoinStatus
    version?: IntFieldUpdateOperationsInput | number
    virtualSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    graduationInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    graduationCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    raydiumPoolAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpMintAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpTokensBurned?: BoolFieldUpdateOperationsInput | boolean
    mintAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    freezeAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUpdateManyWithoutCoinNestedInput
    holdings?: HoldingUpdateManyWithoutCoinNestedInput
    candles?: CandleUpdateManyWithoutCoinNestedInput
  }

  export type CoinUncheckedUpdateWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    mintAddress?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    imageUri?: StringFieldUpdateOperationsInput | string
    metadataUri?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCoinStatusFieldUpdateOperationsInput | $Enums.CoinStatus
    version?: IntFieldUpdateOperationsInput | number
    virtualSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    graduationInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    graduationCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    raydiumPoolAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpMintAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpTokensBurned?: BoolFieldUpdateOperationsInput | boolean
    mintAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    freezeAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    transactions?: TransactionUncheckedUpdateManyWithoutCoinNestedInput
    holdings?: HoldingUncheckedUpdateManyWithoutCoinNestedInput
    candles?: CandleUncheckedUpdateManyWithoutCoinNestedInput
  }

  export type CoinUncheckedUpdateManyWithoutCreatorInput = {
    id?: StringFieldUpdateOperationsInput | string
    mintAddress?: StringFieldUpdateOperationsInput | string
    name?: StringFieldUpdateOperationsInput | string
    symbol?: StringFieldUpdateOperationsInput | string
    description?: StringFieldUpdateOperationsInput | string
    imageUri?: StringFieldUpdateOperationsInput | string
    metadataUri?: NullableStringFieldUpdateOperationsInput | string | null
    status?: EnumCoinStatusFieldUpdateOperationsInput | $Enums.CoinStatus
    version?: IntFieldUpdateOperationsInput | number
    virtualSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realSolReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    realTokenReserves?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFeesCollected?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerFeeSnapshot?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    referrerWallet?: NullableStringFieldUpdateOperationsInput | string | null
    graduationInitiatedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    graduationCompletedAt?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    raydiumPoolAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpMintAddress?: NullableStringFieldUpdateOperationsInput | string | null
    lpTokensBurned?: BoolFieldUpdateOperationsInput | boolean
    mintAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    freezeAuthorityRevoked?: BoolFieldUpdateOperationsInput | boolean
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUpdateWithoutProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    tradeType?: EnumTradeTypeFieldUpdateOperationsInput | $Enums.TradeType
    txSignature?: StringFieldUpdateOperationsInput | string
    slot?: BigIntFieldUpdateOperationsInput | bigint | number
    solAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tokenAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    pricePerToken?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referrerFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    treasuryFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualSolAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokensAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    confirmedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    coin?: CoinUpdateOneRequiredWithoutTransactionsNestedInput
  }

  export type TransactionUncheckedUpdateWithoutProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    coinId?: StringFieldUpdateOperationsInput | string
    tradeType?: EnumTradeTypeFieldUpdateOperationsInput | $Enums.TradeType
    txSignature?: StringFieldUpdateOperationsInput | string
    slot?: BigIntFieldUpdateOperationsInput | bigint | number
    solAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tokenAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    pricePerToken?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referrerFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    treasuryFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualSolAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokensAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    confirmedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyWithoutProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    coinId?: StringFieldUpdateOperationsInput | string
    tradeType?: EnumTradeTypeFieldUpdateOperationsInput | $Enums.TradeType
    txSignature?: StringFieldUpdateOperationsInput | string
    slot?: BigIntFieldUpdateOperationsInput | bigint | number
    solAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tokenAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    pricePerToken?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referrerFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    treasuryFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualSolAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokensAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    confirmedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HoldingUpdateWithoutProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    tokenBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    costBasisSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalBought?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalSold?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    coin?: CoinUpdateOneRequiredWithoutHoldingsNestedInput
  }

  export type HoldingUncheckedUpdateWithoutProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    coinId?: StringFieldUpdateOperationsInput | string
    tokenBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    costBasisSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalBought?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalSold?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HoldingUncheckedUpdateManyWithoutProfileInput = {
    id?: StringFieldUpdateOperationsInput | string
    coinId?: StringFieldUpdateOperationsInput | string
    tokenBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    costBasisSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalBought?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalSold?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionCreateManyCoinInput = {
    id?: string
    walletAddress: string
    tradeType: $Enums.TradeType
    txSignature: string
    slot: bigint | number
    solAmount: Decimal | DecimalJsLike | number | string
    tokenAmount: Decimal | DecimalJsLike | number | string
    pricePerToken: Decimal | DecimalJsLike | number | string
    totalFee: Decimal | DecimalJsLike | number | string
    creatorFee: Decimal | DecimalJsLike | number | string
    referrerFee?: Decimal | DecimalJsLike | number | string
    treasuryFee: Decimal | DecimalJsLike | number | string
    virtualSolAfter: Decimal | DecimalJsLike | number | string
    virtualTokensAfter: Decimal | DecimalJsLike | number | string
    confirmedAt: Date | string
    createdAt?: Date | string
  }

  export type HoldingCreateManyCoinInput = {
    id?: string
    walletAddress: string
    tokenBalance: Decimal | DecimalJsLike | number | string
    costBasisSol?: Decimal | DecimalJsLike | number | string
    totalBought?: Decimal | DecimalJsLike | number | string
    totalSold?: Decimal | DecimalJsLike | number | string
    updatedAt?: Date | string
  }

  export type CandleCreateManyCoinInput = {
    id?: string
    timeframe: $Enums.Timeframe
    openTime: bigint | number
    open: Decimal | DecimalJsLike | number | string
    high: Decimal | DecimalJsLike | number | string
    low: Decimal | DecimalJsLike | number | string
    close: Decimal | DecimalJsLike | number | string
    volume: Decimal | DecimalJsLike | number | string
    trades?: number
    updatedAt?: Date | string
  }

  export type TransactionUpdateWithoutCoinInput = {
    id?: StringFieldUpdateOperationsInput | string
    tradeType?: EnumTradeTypeFieldUpdateOperationsInput | $Enums.TradeType
    txSignature?: StringFieldUpdateOperationsInput | string
    slot?: BigIntFieldUpdateOperationsInput | bigint | number
    solAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tokenAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    pricePerToken?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referrerFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    treasuryFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualSolAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokensAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    confirmedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profile?: ProfileUpdateOneRequiredWithoutTransactionsNestedInput
  }

  export type TransactionUncheckedUpdateWithoutCoinInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    tradeType?: EnumTradeTypeFieldUpdateOperationsInput | $Enums.TradeType
    txSignature?: StringFieldUpdateOperationsInput | string
    slot?: BigIntFieldUpdateOperationsInput | bigint | number
    solAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tokenAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    pricePerToken?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referrerFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    treasuryFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualSolAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokensAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    confirmedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type TransactionUncheckedUpdateManyWithoutCoinInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    tradeType?: EnumTradeTypeFieldUpdateOperationsInput | $Enums.TradeType
    txSignature?: StringFieldUpdateOperationsInput | string
    slot?: BigIntFieldUpdateOperationsInput | bigint | number
    solAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    tokenAmount?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    pricePerToken?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    creatorFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    referrerFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    treasuryFee?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualSolAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    virtualTokensAfter?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    confirmedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HoldingUpdateWithoutCoinInput = {
    id?: StringFieldUpdateOperationsInput | string
    tokenBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    costBasisSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalBought?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalSold?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    profile?: ProfileUpdateOneRequiredWithoutHoldingsNestedInput
  }

  export type HoldingUncheckedUpdateWithoutCoinInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    tokenBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    costBasisSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalBought?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalSold?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type HoldingUncheckedUpdateManyWithoutCoinInput = {
    id?: StringFieldUpdateOperationsInput | string
    walletAddress?: StringFieldUpdateOperationsInput | string
    tokenBalance?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    costBasisSol?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalBought?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    totalSold?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CandleUpdateWithoutCoinInput = {
    id?: StringFieldUpdateOperationsInput | string
    timeframe?: EnumTimeframeFieldUpdateOperationsInput | $Enums.Timeframe
    openTime?: BigIntFieldUpdateOperationsInput | bigint | number
    open?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    high?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    low?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    close?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    volume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    trades?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CandleUncheckedUpdateWithoutCoinInput = {
    id?: StringFieldUpdateOperationsInput | string
    timeframe?: EnumTimeframeFieldUpdateOperationsInput | $Enums.Timeframe
    openTime?: BigIntFieldUpdateOperationsInput | bigint | number
    open?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    high?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    low?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    close?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    volume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    trades?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type CandleUncheckedUpdateManyWithoutCoinInput = {
    id?: StringFieldUpdateOperationsInput | string
    timeframe?: EnumTimeframeFieldUpdateOperationsInput | $Enums.Timeframe
    openTime?: BigIntFieldUpdateOperationsInput | bigint | number
    open?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    high?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    low?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    close?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    volume?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    trades?: IntFieldUpdateOperationsInput | number
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}