let enforceSingleVersion = [
    'react-hot-toast', //
    'react',
    '@types/react',
    'react-dom',
    'next-auth',
    'next',
    'date-fns',
    // 'styled-jsx',
    'nprogress',
    'tailwindcss',
    '@chakra-ui/react',
    '@headlessui/react',

    // 'html-dom-parser',
]

// enforceSingleVersion = []

function afterAllResolved(lockfile, context) {
    console.log(`Checking duplicate packages`)
    const packagesKeys = Object.keys(lockfile.packages)
    const found = {}
    for (let p of packagesKeys) {
        for (let x of enforceSingleVersion) {
            if (p.startsWith(`/${x}/`)) {
                if (found[x]) {
                    found[x] += 1
                } else {
                    found[x] = 1
                }
            }
        }
    }
    let msg = ''
    for (let p in found) {
        const count = found[p]
        if (count > 1) {
            msg += `${p} found ${count} times\n`
            msg += explainProblemInDuplicateDep(p, lockfile)
        }
    }
    if (msg) {
        throw new Error(msg)
    }
    return lockfile
}

function explainProblemInDuplicateDep(package, lockfile) {
    const packagesKeys = Object.keys(lockfile.packages)
    let found = {}
    for (let p of packagesKeys) {
        if (p.startsWith(`/${package}/`)) {
            const config = lockfile.packages[p]
            found[p] = Object.keys(config.dependencies || {}).map(
                (k) => `${k}@${config.dependencies[k]}`,
            )
        }
    }

    const differences = getDifferences(Object.values(found))

    if (differences.length) {
        return `${package} has different set of dependencies:\n${JSON.stringify(
            differences,
            null,
            2,
        )}`
    }
    return ''
}

// return different items from a list of arrays of strings
function getDifferences(arrays) {
    const result = {}
    for (let a of arrays) {
        for (let x of a) {
            if (result[x]) {
                result[x] += 1
            } else {
                result[x] = 1
            }
        }
    }
    for (let x in result) {
        if (result[x] === arrays.length) {
            delete result[x]
        }
    }
    return Object.keys(result)
}

module.exports = {
    hooks: {
        afterAllResolved,
    },
}
