export const ERRORS = {
    NO_PROVIDER: {
        type: 'NO_PROVIDER',
        description: 'Could not find an instance of the dAPI in the webpage',
        data: null
    },
    CONNECTION_DENIED: {
        type: 'CONNECTION_DENIED',
        description: 'The dAPI provider refused to process this request',
        data: null
    },
    REQUEST_ERROR: {
        type: 'REQUEST_ERROR',
        description: 'An request error occured when submitting the request',
        data: null
    },
    RPC_ERROR: {
        type: 'RPC_ERROR',
        description: 'An RPC error occured when submitting the request',
        data: null
    },
    MALFORMED_INPUT: {
        type: 'MALFORMED_INPUT',
        description: 'Please check your input',
        data: null
    },
    CANCELLED: {
        type: 'CANCELED',
        description: 'The user cancels, or refuses the dapps request',
        data: null
    },
    INSUFFICIENT_FUNDS: {
        type: 'INSUFFICIENT_FUNDS',
        description: 'The user does not have a sufficient balance to perform the requested action',
        data: null
    },
    DEFAULT: {
        type: 'FAIL',
        description: 'The request failed.',
        data: null
    },
    CHAIN_NOT_MATCH: {
        type: 'CHAIN_NOT_MATCH',
        description: 'The currently opened chain does not match the type of the call chain, please switch the chain.',
        data: null
    }
};
