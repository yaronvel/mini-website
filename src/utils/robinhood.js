import { ethers, FetchRequest } from 'ethers';
import circuitBreakerAbi from '../data/abis/CircuitBreaker.json';
import sanityPnlAbi from '../data/abis/SanityPnl.json';
import { calculateBlockNumbers, getCurrentBlockInfo } from './blockUtils.js';

export const ROBINHOOD_PUBLIC_RPC_URL = 'https://rpc.mainnet.chain.robinhood.com';
export const ROBINHOOD_1INCH_RPC_URL = 'https://api.1inch.com/web3/4663/archive';
export const ROBINHOOD_CHAIN_ID = 4663;
export const ROBINHOOD_BLOCK_TIME_SECONDS = 0.1;
export const ROBINHOOD_FIRST_BLOCK = 10330897;

export const ROBINHOOD_WALLET_ADDRESS =
  '0xcA9bf993eB00f641F1d4EBf6f334f1Ff04074EF6';
export const ROBINHOOD_SANITY_PNL_ADDRESS =
  '0x351d0AeF16f04C3730299Da7bf898bFB9d66561E';
export const ROBINHOOD_CIRCUIT_BREAKER_ADDRESS =
  '0xd218b2B96dA54b7B7170AfF8b99d2DF8BA6d3334';
export const ROBINHOOD_PNL_ANCHOR_BLOCK = ROBINHOOD_FIRST_BLOCK;

export const ROBINHOOD_TOKENS = {
  weth: '0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73',
  usdc: '0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168',
  virtual: '0xc6911796042b15d7Fa4F6CDe69e245DdCd3d9c31'
};

export const ROBINHOOD_VOLUME_TOKENS = {
  weth: ROBINHOOD_TOKENS.weth,
  usdg: ROBINHOOD_TOKENS.usdc
};

export const ROBINHOOD_VOLUME_TOKEN_LABELS = {
  weth: 'WETH',
  usdg: 'USDG'
};

function dedupeAddresses(addresses) {
  const seen = new Set();
  const result = [];
  for (const address of addresses) {
    const normalized = address.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(ethers.getAddress(address));
  }
  return result;
}

/** Robinhood 0x volume dest addresses — summed per category in volume stats. */
export const ROBINHOOD_0X_NORMAL_VOLUME_DESTS = dedupeAddresses([
  '0x1d4B86491ec211257cbedD77A4380a7494624EfF',
  '0xaa61254627B7392B0bC922097b10eB0587db2Be7',
  '0x39b38686A19836Ac10162c490E4558e120CbBE5f',
  '0x6aa80DbBed9ae5aB45FbF61f9644faDA3b29326E',
  '0x24A4d86c8A76B00EE9566eD9C9Ff4f0c3Faf0da7',
  '0xE8852602f84e04e284286d8Db01a41Edd0CCEFb0',
  '0x32ea82c2B03Cb072afD67Af9041822c9caA922a8',
  '0xBA3B33bba2ebFAe62e218acee06080816af252D9',
  '0x4039FF700Bd3c4fE6A5ea72376d2363dF72f4DE3',
  '0x37208CbfbbBfFAF3AB24F922F3A4a6BBAbEB9BE6',
  '0x503F4e1B18D55Af61e57598BF5a8F0023c8008E3',
  '0xc7a80492d31D5589c50f418e22d75728C36DeD66',
  '0x83203a9648320bcd3F24421B6CcD51267F3840DB',
  '0x348F3531119f27D3D009EC0b92b6884692C7c951',
  '0x1A462Df60a7bF2Ed25d7BF34902858B1c1564290',
  '0x060D5cBE05a76BE735b2E507a1447A08D5A0dd8E',
  '0x1D40c35A11e74C76CeC87bD86fFC24dD812F2589',
  '0x3Be7D60f563cb527454eDDd7737582983396c4Dd',
  '0xdd1B902b36eaDE6DE862F89C590Fb98C5481a292',
  '0xD76d2FceC21714A31a37a8D26662A1F6292e3d34',
  '0x9D6f6c7143Dff0C86a984FFEd30Bd05D28f07A2d',
  '0x88E556d72C983607C13858da339c7EF291A063C2',
  '0x582707150a70d4B786478AfeC2AC63Ca50649cae',
  '0xb7FcBB77E3573E4CD175828614568a484240e37B',
  '0x6e26538D9f1A23409e163AF2c38ce9E6e4E83752',
  '0x7fD87a660678C67544f1F1F306bd497Abc4a8bAd',
  '0x9531d206a44283fE1Dd917E71bBF1BB992145E4E',
  '0x714629334c4EAD6882fA66482499668BF266b92e',
  '0xaA4Ae78c80547ff07fCC848a28aa0D70A9d4b11e',
  '0x28B627565503f6aE281703F71864Bc5466A22c91',
  '0x0D73A86e6754d0858c45bBDc8B55DA2F204c8704',
  '0x9626B0cb6723a28159e089430731d94132cA8AB3',
  '0x8cD684EbCcEaA6483c9C80D3754436dcaaA53553',
  '0x33D7A3Ad0A9A0e6dE1CAf285f7dDb2A5c4FB0e52',
  '0xDDdb646b835a113674f9b1102A9346eE4b27Ed5c',
  '0x8Bf56ac1C2f6eca6FB91df81E06FE7BA3BC7857f',
  '0x216d701b199b33Cf9303AEb79bda855eA1a85A7C',
  '0x9A8289877Dcc0d78B708FF1967B1FB1C92aF2FEd',
  '0x3a8Bc6070B02B9Fcc87ADb13090E52fD136d38f7',
  '0x19CC47a5888640cB4c48FfAA2328119aCCd367c9',
  '0xd9031dfd8645e27F3787147C9208e045dd49AA52'
]);

export const ROBINHOOD_0X_ROUTER_VOLUME_DESTS = dedupeAddresses([
  '0x1167cB478D05d6B8178e6881354E0F052Fd234c1',
  '0xdfCfa68D1D8C71Dd1fD048C793C13C5738CF14a8',
  '0x12eb2440CCDAaF593A0C57Ea47fa8C01cC673d9D',
  '0x03390030a8054ceDbf49920A91ec84d3210B2EAE',
  '0x8627977302C8b880F3954F255029c745E94Fc9c4',
  '0x9911c3D4B6aD824590C466A8646D4fc5966E4Fc3',
  '0x89C42658c4afe894ad0E1DdfC4b829A70c566c6e',
  '0x4753aC723699DcFc65214FD1d7993d2b26Ee7122',
  '0x989CdaC29f1df10E3BE9C02502031f3874755f6f',
  '0x060071b65e0c0f70510037680c058E982B332C47',
  '0x91F8318C5B94DC53C9f544079C4F2C1247372010',
  '0xB39b9f97C9792814d6769eCa400a49Be4753D38a',
  '0xBCfD7B52b8a16C5e3Aa0A481086674CeBe606DEe',
  '0x31A6da41aB90C3f9D98e5b2C1Bb27E8BAa662b90',
  '0x4EEd94151Cbb31350948116E5738C36D09C735fb',
  '0x2242c022f2a4eEdAACbF8972924FD789E37b2e88',
  '0x8684D4a24260bf5B4Bdaf39a59EAC067CCaf1553',
  '0x34382EC18E2575333D2B44a8DAeEd404eB82BE94',
  '0x7808EFaabdFe68EB51f7c59493dcDF07693D3bec',
  '0xCDAC9ea34A7025604Ad154A7f1Bf54c3d5Dc2751',
  '0xAaADE1B0c75e58A8B2253e0716ec7fba84438066',
  '0x68a82297CFE20D2132a3f98cFaF80f76d4ef1c8e',
  '0x2DEb99957FEaF433BD5fB3C09d07e4435e05B498',
  '0x9a1A56a53639f06f535578b912972Db748772232',
  '0x61A34849d38683E205Ae089094051E8B0696EE3c',
  '0x6EA2b423f1eA81E883C26EAd7ED1ADB4d1D54C2e',
  '0x9fE0C59A665b0c664dC658C0b850e1B28a7a1712',
  '0x0E39DF03c0627dE86391db9b60b27866C57b7808',
  '0x2ee52C1694B2fCfC9529CE311BCDD8BBe0C9ED48',
  '0xE6A5b89F6852f07373f88BFf427bC18e5D28b38A',
  '0x08C5E8931fc69647fB77Bf04354Edcb44e781a24',
  '0x9b3822d982b6B87bF5c6Ee52C9f042C14dF0B3A4',
  '0x188D8eF22cF1f4Cad61F1539CFeA88cbA592B4b2',
  '0xc0C6C20c54DD18C3cD12b09c5f6C0F9350a0b615',
  '0x31524E66a05597a20F1fdFcD4D44112B8ff5dB80',
  '0xbE11c00875FA817454079c89431B6f25019bA465',
  '0xcf587bE11C9a9126B4C95550cb24E0746E7E9bc0',
  '0xA6d2238aa92843D61228fd8383BAcC5908c88266',
  '0x944D78CbbE228DaE09B6137Ac54A0476e91A4522',
  '0x0aF17F5956af89B60c4Fc45a2499740A48d4E582',
  '0xd973b87E01bA26e4E69e3095d5891b8B01fdDe57'
]);

export const ROBINHOOD_0X_INTENT_VOLUME_DESTS = dedupeAddresses([
  '0xFDb98116df7345E31d8588eF0e9BE166818A5C07',
  '0xeC6F269278B494DDE9Dee114B530ACDc3313e4bb',
  '0x6aea160407e73658C6c546de727a7ef4CD73a1ad',
  '0x14693eFbBDD85EB8C92001C284089f3EB6696648',
  '0xD4a5B907633E4b74b0189B51F5df5eF244adcC3B',
  '0x0C94ed119BaAB02581586078E892A8504890F164',
  '0x76F29BFa3126ECA15ce29D37161AEDf1886a5c8B',
  '0x3bE67b167A84483BDFE02F5a476569E44a363b6d',
  '0x92834aFB129a13C2631d61E7F7D657A625A6b5Eb',
  '0xBfF0DB5BBbe74E5A8DaE8F33D6a766f8dec4D2b1',
  '0x5e3fccf265bCa73C121b5145ABeB86628808b789',
  '0x8dC3Fc61C7Ec7b46FC23e44427f33136FED12cbD',
  '0x06EcB5ADE196a14d4874099cf748239c1F6b5c4A',
  '0x4157fc85782435B512df3e5099cD4373099e567f',
  '0xE1A807234eeE36475ED2d382AA261907F7f4131c',
  '0x02Ac6F13809a196eD922D65ceD9b4087CC0a433B',
  '0x55FA935D9ca32cB85E37580e104a49bF95aa48FB',
  '0x8fcde70a26E45f49B157F4af349ee4F178f83c05',
  '0xaC3AC468D4599D8C71DcAD6BF641B17A64D10ddf',
  '0xe36186b2E76B800fa726c0Cc968317bbdbC3831d',
  '0xab1aF14ecbFe8242babb08d43B6352BF8cb37C44',
  '0xf5C6AfCB791a2e9f360865D47B23e5d99DA05518',
  '0xe0FC99048a67019FB9c92b9a4220df75dC4d3e1f',
  '0xA9d6284b0a80977c7D8235194faE3413E98fDdF2',
  '0x4a71E7Fa8D32055416104ce3c25765C697aA96a9',
  '0xe7E7bDBA33559afB265beB26c48EFedc0A0A5AC0',
  '0xB20A54B2b2B0a499f3C56489410EC429A65844c4',
  '0xDbE909cf7Ea63893cF6bA9A33D4486147b164E31',
  '0xb01a43257e63595c6E2a644ee102449CCe70b5B4',
  '0xEfD92673760cF7Ca292E1d517150e0c226A881f3',
  '0x537526d3973777c752721F541073DFdF25Fdd5c7',
  '0x4C050295671513fFC934E0Dff51a4dA855e317e0',
  '0x799c3eebE22DcF72E8Ac549ee1e83FE6c785950B',
  '0x7736784A43aaC81fe43d9995a60A324c975c97a0',
  '0xb531d1aC7143A802881990Fd4140882f8D6D9e44',
  '0xFEda98bDCdAbcf0dfB67067ca3F7F4b160cebD2c',
  '0x7A65770DAB53A3813b495B0B5184d41326eeF10f',
  '0x1990965674F2B1c126636a094370b69949a4A3BE',
  '0xa6812c43077DeA42891b3574dF5B789D5Ce0Ae60',
  '0x51DEe4b7bD663aaCE14c6118a5cdF5060d0C9643',
  '0x81B149Ca37cAd0b58fE93108Dee99B4804709Aa6'
]);

export const ROBINHOOD_VOLUME_DESTS_BY_AGGREGATOR = {
  normal0x: ROBINHOOD_0X_NORMAL_VOLUME_DESTS,
  router0x: ROBINHOOD_0X_ROUTER_VOLUME_DESTS,
  intent0x: ROBINHOOD_0X_INTENT_VOLUME_DESTS,
  kyberSwap: ['0x8F10B468b06c6FD214B65F87778827F7D113f996']
};

/** Keys for StatsTable columns (addresses live in {@link ROBINHOOD_VOLUME_DESTS_BY_AGGREGATOR}). */
export const ROBINHOOD_AGGREGATORS = Object.fromEntries(
  Object.keys(ROBINHOOD_VOLUME_DESTS_BY_AGGREGATOR).map((key) => [key, key])
);

export const ROBINHOOD_AGGREGATOR_DISPLAY_NAMES = {
  normal0x: 'normal 0x',
  router0x: 'router 0x',
  intent0x: '0x intents',
  kyberSwap: 'KyberSwap'
};

export const ROBINHOOD_TOKEN_DECIMALS = {
  weth: 18,
  usdc: 6,
  virtual: 18
};

const ROBINHOOD_TOKEN_LABELS = {
  weth: 'WETH',
  usdc: 'USDC',
  virtual: 'Virtual'
};

const QUOTE_IMPL_ABI = [
  {
    inputs: [],
    name: 'getListedTokens',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function'
  }
];

const ERC20_ABI = [
  {
    inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function'
  }
];

function formatRobinhoodError(error, label) {
  const detail =
    error?.shortMessage ?? error?.info?.error?.message ?? error?.message ?? String(error);
  return label ? `${label}: ${detail}` : detail;
}

function create1inchRobinhoodProvider(bearerToken) {
  const fetchRequest = new FetchRequest(ROBINHOOD_1INCH_RPC_URL);
  fetchRequest.setHeader('Authorization', `Bearer ${bearerToken}`);
  return new ethers.JsonRpcProvider(fetchRequest, {
    chainId: ROBINHOOD_CHAIN_ID,
    name: 'robinhood'
  });
}

function createPublicRobinhoodProvider() {
  return new ethers.JsonRpcProvider(ROBINHOOD_PUBLIC_RPC_URL, {
    chainId: ROBINHOOD_CHAIN_ID,
    name: 'robinhood'
  });
}

/** Prefer 1inch archive RPC when a bearer token is available; otherwise public Robinhood RPC. */
export async function resolveRobinhoodProvider(bearerToken) {
  if (bearerToken) {
    try {
      const provider = create1inchRobinhoodProvider(bearerToken);
      await provider.getBlockNumber();
      return { provider, error: null };
    } catch (error) {
      return {
        provider: null,
        error: formatRobinhoodError(error, '1inch Robinhood RPC failed')
      };
    }
  }

  try {
    const provider = createPublicRobinhoodProvider();
    await provider.getBlockNumber();
    return { provider, error: null };
  } catch (error) {
    return {
      provider: null,
      error: formatRobinhoodError(error, 'Robinhood RPC failed')
    };
  }
}

function robinhoodTokenErrorRows(errorMessage) {
  return Object.keys(ROBINHOOD_TOKENS).map((key) => ({
    key,
    label: tokenLabel(key),
    balance: null,
    target: null,
    imbalanceNative: null,
    imbalanceUsd: null,
    percentage: 0,
    error: errorMessage
  }));
}

function tokenKeyForAddress(address) {
  const normalized = address.toLowerCase();
  for (const [key, tokenAddress] of Object.entries(ROBINHOOD_TOKENS)) {
    if (tokenAddress.toLowerCase() === normalized) return key;
  }
  return normalized;
}

function tokenLabel(key) {
  return ROBINHOOD_TOKEN_LABELS[key] ?? key;
}

function toBigInt(value) {
  return typeof value === 'bigint' ? value : BigInt(value.toString());
}

/** Decode a 256-bit two's-complement integer (handles negative bps from calcDeviation). */
function toSignedInt256(raw) {
  const value = toBigInt(raw);
  const signBit = 1n << 255n;
  if (value >= signBit) {
    return value - (1n << 256n);
  }
  return value;
}

function scaleInt256ToNumber(raw) {
  const value = toSignedInt256(raw);
  const scale = 10n ** 36n;
  const whole = value / scale;
  const fraction = value % scale;
  return Number(whole) + Number(fraction) / Number(scale);
}

async function readPnlUsd(sanityContract, blockTag) {
  const raw = await sanityContract.pnl({ blockTag });
  return scaleInt256ToNumber(raw);
}

function robinhoodBlockAtSecondsAgo(
  currentBlock,
  secondsAgo,
  minBlock = ROBINHOOD_FIRST_BLOCK
) {
  const blocksBack = Math.floor(secondsAgo / ROBINHOOD_BLOCK_TIME_SECONDS);
  const calculated = currentBlock - blocksBack;
  return {
    block: Math.max(minBlock, calculated),
    hasFullData: calculated >= minBlock
  };
}

function robinhoodHoursAgoBlock(currentBlock, hours, minBlock = ROBINHOOD_FIRST_BLOCK) {
  return robinhoodBlockAtSecondsAgo(currentBlock, hours * 3600, minBlock);
}

function robinhoodMtmPeriodChange(current, previous, hasFullData) {
  return current != null && previous != null && hasFullData
    ? current - previous
    : null;
}

/** Current Robinhood PropAMM wallet value + circuit breaker min USD threshold. */
export async function fetchRobinhoodWalletValue(bearerToken = null) {
  const { provider, error: rpcError } = await resolveRobinhoodProvider(bearerToken);
  if (!provider) {
    return { current: null, minUSDValue: null, error: rpcError };
  }

  try {
    const circuitBreaker = new ethers.Contract(
      ROBINHOOD_CIRCUIT_BREAKER_ADDRESS,
      circuitBreakerAbi,
      provider
    );
    const [valueRaw, minUsdRaw] = await Promise.all([
      circuitBreaker.getWalletValue(),
      circuitBreaker.minUSDValue()
    ]);
    const current = Number(valueRaw?.toString?.() ?? valueRaw);
    const minUSDValue = Number(minUsdRaw?.toString?.() ?? minUsdRaw);
    return {
      current: Number.isFinite(current) ? current : null,
      minUSDValue: Number.isFinite(minUSDValue) ? minUSDValue : null,
      error: null
    };
  } catch (error) {
    const message = formatRobinhoodError(error, 'getWalletValue failed');
    return { current: null, minUSDValue: null, error: message };
  }
}

/** MTM-style PnL deltas from SanityPnl `pnl()` on Robinhood chain. */
export async function fetchRobinhoodMtmSnapshot(bearerToken = null) {
  const { provider, error: rpcError } = await resolveRobinhoodProvider(bearerToken);
  if (!provider) {
    return {
      value: null,
      change1h: null,
      change24h: null,
      change7d: null,
      changeSinceJune18: null,
      error: rpcError
    };
  }

  try {
    const sanityContract = new ethers.Contract(
      ROBINHOOD_SANITY_PNL_ADDRESS,
      sanityPnlAbi,
      provider
    );

    const { blockNumber } = await getCurrentBlockInfo(provider);
    const minBlock = ROBINHOOD_FIRST_BLOCK;

    const oneHour = robinhoodHoursAgoBlock(blockNumber, 1, minBlock);
    const twentyFourHours = robinhoodHoursAgoBlock(blockNumber, 24, minBlock);
    const sevenDays = robinhoodHoursAgoBlock(blockNumber, 24 * 7, minBlock);

    const [pnlNow, pnl1h, pnl24h, pnl7d] = await Promise.all([
      readPnlUsd(sanityContract, blockNumber),
      oneHour.hasFullData
        ? readPnlUsd(sanityContract, oneHour.block)
        : Promise.resolve(null),
      twentyFourHours.hasFullData
        ? readPnlUsd(sanityContract, twentyFourHours.block)
        : Promise.resolve(null),
      sevenDays.hasFullData
        ? readPnlUsd(sanityContract, sevenDays.block)
        : Promise.resolve(null)
    ]);

    return {
      value: pnlNow,
      change1h: robinhoodMtmPeriodChange(pnlNow, pnl1h, oneHour.hasFullData),
      change24h: robinhoodMtmPeriodChange(
        pnlNow,
        pnl24h,
        twentyFourHours.hasFullData
      ),
      change7d: robinhoodMtmPeriodChange(pnlNow, pnl7d, sevenDays.hasFullData),
      changeSinceJune18: null,
      error: null
    };
  } catch (error) {
    const message = formatRobinhoodError(error, 'Robinhood MTM fetch failed');
    return {
      value: null,
      change1h: null,
      change24h: null,
      change7d: null,
      changeSinceJune18: null,
      error: message
    };
  }
}

/** Robinhood PropAMM wallet balances vs SanityPnl targets (WETH, Virtual, USDC). */
export async function fetchRobinhoodTokenBalances(bearerToken = null) {
  const { provider, error: rpcError } = await resolveRobinhoodProvider(bearerToken);
  if (!provider) {
    return null;
  }

  const sanityContract = new ethers.Contract(
    ROBINHOOD_SANITY_PNL_ADDRESS,
    sanityPnlAbi,
    provider
  );

  const balanceData = {};

  for (const [key, tokenAddress] of Object.entries(ROBINHOOD_TOKENS)) {
    try {
      const decimals = ROBINHOOD_TOKEN_DECIMALS[key];
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [balanceRaw, targetRaw] = await Promise.all([
        tokenContract.balanceOf(ROBINHOOD_WALLET_ADDRESS),
        sanityContract.targets(tokenAddress)
      ]);

      const balanceBig = toBigInt(balanceRaw);
      const targetBig = toBigInt(targetRaw);
      const divisor = 10n ** BigInt(decimals);
      const balance = Number(balanceBig) / Number(divisor);
      const target = Number(targetBig) / Number(divisor);

      balanceData[key] = {
        balance,
        target,
        percentage: target > 0 ? (balance / target) * 100 : 0
      };
    } catch (error) {
      console.warn(`Robinhood token balance fetch failed for ${key}:`, error);
      balanceData[key] = { balance: 0, target: 0, percentage: 0, error: formatRobinhoodError(error) };
    }
  }

  return balanceData;
}

/** PnL circuit breaker snapshot from Robinhood SanityPnl (referencePnl, maxLoss, current loss). */
export async function fetchRobinhoodSanityPnlCircuitBreaker(bearerToken = null) {
  const { provider, error: rpcError } = await resolveRobinhoodProvider(bearerToken);
  if (!provider) {
    return { referencePnl: null, maxAllowedLoss: null, delta: null, error: rpcError };
  }

  try {
    const sanityContract = new ethers.Contract(
      ROBINHOOD_SANITY_PNL_ADDRESS,
      sanityPnlAbi,
      provider
    );
    const pnlFn = sanityContract.getFunction('pnl()');
    const [referenceRaw, maxLossRaw, pnlRaw] = await Promise.all([
      sanityContract.referencePnl(),
      sanityContract.maxLoss(),
      pnlFn()
    ]);

    const referencePnl = scaleInt256ToNumber(referenceRaw);
    const currentPnl = scaleInt256ToNumber(pnlRaw);
    const maxB = toBigInt(maxLossRaw);
    const scale = 1e36;

    return {
      referencePnl,
      maxAllowedLoss: Number(maxB) / scale,
      delta: currentPnl - referencePnl,
      error: null
    };
  } catch (error) {
    const message = formatRobinhoodError(error, 'Robinhood SanityPnl fetch failed');
    return { referencePnl: null, maxAllowedLoss: null, delta: null, error: message };
  }
}

async function collectImbalanceTokens(provider, circuitBreaker, sanityContract) {
  const quoteAddress = await circuitBreaker.quoteImpl();
  const quoteContract = new ethers.Contract(
    quoteAddress,
    QUOTE_IMPL_ABI,
    provider
  );
  const usdcAddress = await sanityContract.usdc();
  const listedTokens = await quoteContract.getListedTokens();

  const seen = new Set();
  const tokens = [];
  for (const address of [...listedTokens, usdcAddress]) {
    const normalized = address.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    tokens.push(address);
  }
  return tokens;
}

/** Current wallet value, PnL vs anchor block, and Robinhood-only imbalance snapshot. */
export async function fetchRobinhoodSnapshot(bearerToken = null) {
  const { provider, error: rpcError } = await resolveRobinhoodProvider(bearerToken);
  if (!provider) {
    return {
      blockNumber: null,
      walletValueUsd: null,
      walletValueError: rpcError,
      pnlCurrentUsd: null,
      pnlError: rpcError,
      pnlChangeUsd: null,
      pnlAnchorBlock: ROBINHOOD_PNL_ANCHOR_BLOCK,
      totalImbalanceUsd: null,
      tokens: robinhoodTokenErrorRows(rpcError),
      rpcError
    };
  }

  const circuitBreaker = new ethers.Contract(
    ROBINHOOD_CIRCUIT_BREAKER_ADDRESS,
    circuitBreakerAbi,
    provider
  );
  const sanityContract = new ethers.Contract(
    ROBINHOOD_SANITY_PNL_ADDRESS,
    sanityPnlAbi,
    provider
  );

  let blockNumber = null;
  try {
    ({ blockNumber } = await getCurrentBlockInfo(provider));
  } catch (error) {
    const message = formatRobinhoodError(error, 'Robinhood block fetch failed');
    return {
      blockNumber: null,
      walletValueUsd: null,
      walletValueError: message,
      pnlCurrentUsd: null,
      pnlError: message,
      pnlChangeUsd: null,
      pnlAnchorBlock: ROBINHOOD_PNL_ANCHOR_BLOCK,
      totalImbalanceUsd: null,
      tokens: robinhoodTokenErrorRows(message),
      rpcError: message
    };
  }

  let walletValueUsd = null;
  let walletValueError = null;
  try {
    const raw = await circuitBreaker.getWalletValue();
    walletValueUsd = Number(raw.toString());
  } catch (error) {
    walletValueError = formatRobinhoodError(error, 'getWalletValue failed');
    console.warn('Robinhood getWalletValue failed:', error);
  }

  let pnlCurrentUsd = null;
  let pnlAnchorUsd = null;
  let pnlError = null;
  try {
    pnlCurrentUsd = await readPnlUsd(sanityContract, 'latest');
    pnlAnchorUsd = await readPnlUsd(sanityContract, ROBINHOOD_PNL_ANCHOR_BLOCK);
  } catch (error) {
    pnlError = formatRobinhoodError(error, 'pnl read failed');
    console.warn('Robinhood pnl read failed:', error);
  }

  let tokenAddresses = Object.values(ROBINHOOD_TOKENS);
  try {
    tokenAddresses = await collectImbalanceTokens(
      provider,
      circuitBreaker,
      sanityContract
    );
  } catch (error) {
    console.warn('Robinhood token list failed, using defaults:', error);
  }

  const tokenRows = [];
  for (const tokenAddress of tokenAddresses) {
    try {
      const key = tokenKeyForAddress(tokenAddress);
      const decimals =
        ROBINHOOD_TOKEN_DECIMALS[key] ??
        Number(
          await new ethers.Contract(tokenAddress, ERC20_ABI, provider).decimals()
        );
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
      const [balanceRaw, targetRaw] = await Promise.all([
        tokenContract.balanceOf(ROBINHOOD_WALLET_ADDRESS),
        sanityContract.targets(tokenAddress)
      ]);

      const balanceBig = toBigInt(balanceRaw);
      const targetBig = toBigInt(targetRaw);
      const imbalanceNativeBig = balanceBig - targetBig;
      const imbalanceUsdRaw = await sanityContract.getUSDValue(
        tokenAddress,
        imbalanceNativeBig
      );

      const divisor = 10n ** BigInt(decimals);
      const balance = Number(balanceBig) / Number(divisor);
      const target = Number(targetBig) / Number(divisor);
      const imbalanceNative = Number(imbalanceNativeBig) / Number(divisor);
      const imbalanceUsd = scaleInt256ToNumber(imbalanceUsdRaw);

      tokenRows.push({
        key,
        label: tokenLabel(key),
        balance,
        target,
        imbalanceNative,
        imbalanceUsd,
        percentage: target > 0 ? (balance / target) * 100 : 0,
        error: null
      });
    } catch (error) {
      const key = tokenKeyForAddress(tokenAddress);
      const message = formatRobinhoodError(error, `${tokenLabel(key)} fetch failed`);
      console.warn(`Robinhood imbalance fetch failed for ${tokenAddress}:`, error);
      tokenRows.push({
        key,
        label: tokenLabel(key),
        balance: null,
        target: null,
        imbalanceNative: null,
        imbalanceUsd: null,
        percentage: 0,
        error: message
      });
    }
  }

  const totalImbalanceUsd = tokenRows.reduce(
    (sum, row) => sum + (row.imbalanceUsd ?? 0),
    0
  );

  return {
    blockNumber,
    walletValueUsd,
    walletValueError,
    pnlCurrentUsd,
    pnlError,
    pnlChangeUsd:
      pnlCurrentUsd != null && pnlAnchorUsd != null
        ? pnlCurrentUsd - pnlAnchorUsd
        : null,
    pnlAnchorBlock: ROBINHOOD_PNL_ANCHOR_BLOCK,
    totalImbalanceUsd,
    tokens: tokenRows,
    rpcError: null
  };
}

async function readRobinhoodVolume(contract, aggAddress, tokenAddress, blockTag, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await contract.volume(aggAddress, tokenAddress, { blockTag });
    } catch (error) {
      if (attempt === retries) {
        console.warn(
          `Robinhood volume reverted at block ${blockTag} for ${tokenAddress}/${aggAddress}`
        );
        return 0n;
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 100));
    }
  }
  return 0n;
}

function toVolumeBigInt(value) {
  return typeof value === 'bigint' ? value : BigInt(value.toString());
}

async function readRobinhoodVolumeSum(contract, aggAddresses, tokenAddress, blockTag) {
  const volumes = await Promise.all(
    aggAddresses.map((aggAddress) =>
      readRobinhoodVolume(contract, aggAddress, tokenAddress, blockTag)
    )
  );
  return volumes.reduce((sum, volume) => sum + toVolumeBigInt(volume), 0n);
}

/** 1h / 24h volume stats for Robinhood PropAMM (WETH + USDG). */
export async function fetchRobinhoodVolumeStats(bearerToken = null) {
  const { provider, error: rpcError } = await resolveRobinhoodProvider(bearerToken);
  if (!provider) {
    return { error: rpcError };
  }

  try {
    const contract = new ethers.Contract(
      ROBINHOOD_CIRCUIT_BREAKER_ADDRESS,
      circuitBreakerAbi,
      provider
    );

    const { blockNumber, timestamp } = await getCurrentBlockInfo(provider);
    const blocks = calculateBlockNumbers(blockNumber, timestamp, {
      firstBlock: ROBINHOOD_FIRST_BLOCK,
      blockTimeSeconds: ROBINHOOD_BLOCK_TIME_SECONDS
    });

    const aggregatorNames = Object.keys(ROBINHOOD_VOLUME_DESTS_BY_AGGREGATOR);
    const volumeData = {};
    for (const [tokenName, tokenAddress] of Object.entries(ROBINHOOD_VOLUME_TOKENS)) {
      volumeData[tokenName] = {};

      for (const aggName of aggregatorNames) {
        const aggAddresses = ROBINHOOD_VOLUME_DESTS_BY_AGGREGATOR[aggName];
        const [volumeCurrent, volume1h, volume24h] = await Promise.all([
          readRobinhoodVolumeSum(
            contract,
            aggAddresses,
            tokenAddress,
            blocks.current
          ),
          readRobinhoodVolumeSum(
            contract,
            aggAddresses,
            tokenAddress,
            blocks.oneHourAgo
          ),
          readRobinhoodVolumeSum(
            contract,
            aggAddresses,
            tokenAddress,
            blocks.twentyFourHoursAgo
          )
        ]);

        const oneHourVolume = blocks.hasFull1hData ? volumeCurrent - volume1h : 0n;
        const twentyFourHoursVolume = volumeCurrent - volume24h;

        volumeData[tokenName][aggName] = {
          oneHour: oneHourVolume.toString(),
          twentyFourHours: twentyFourHoursVolume.toString()
        };
      }
    }

    const perToken = {};
    const perAggregator = Object.fromEntries(
      aggregatorNames.map((key) => [key, {}])
    );

    for (const tokenName of Object.keys(ROBINHOOD_VOLUME_TOKENS)) {
      perToken[tokenName] = {};
      for (const aggName of aggregatorNames) {
        const vol = volumeData[tokenName][aggName] || {
          oneHour: '0',
          twentyFourHours: '0'
        };
        perToken[tokenName][aggName] = {
          oneHour: vol.oneHour,
          twentyFourHours: vol.twentyFourHours
        };
      }
    }

    for (const aggName of aggregatorNames) {
      for (const tokenName of Object.keys(ROBINHOOD_VOLUME_TOKENS)) {
        const data = volumeData[tokenName][aggName] || {
          oneHour: '0',
          twentyFourHours: '0'
        };
        perAggregator[aggName][tokenName] = {
          oneHour: data.oneHour,
          twentyFourHours: data.twentyFourHours
        };
      }
    }

    let overall1h = 0n;
    let overall24h = 0n;
    for (const tokenName of Object.keys(ROBINHOOD_VOLUME_TOKENS)) {
      for (const aggName of aggregatorNames) {
        const data = volumeData[tokenName][aggName];
        overall1h += BigInt(data.oneHour);
        overall24h += BigInt(data.twentyFourHours);
      }
    }

    return {
      perToken,
      perAggregator,
      overall: {
        oneHour: overall1h.toString(),
        twentyFourHours: overall24h.toString()
      },
      timeSinceFirst: blocks.timeSinceFirst,
      error: null
    };
  } catch (error) {
    return { error: formatRobinhoodError(error, 'Robinhood volume fetch failed') };
  }
}
