import _ from 'lodash'
import { v4 as uuid } from 'uuid'
import { promises as fs, constants as fsc } from 'fs'
import path from 'path'

/**
 * config and snippets generation main utilities
 */

const dataSize = 50000
const timeDifference = 1000
const outDir = '/Users/mohamedlamineallal/dev-tools/SnippetStore'

const shouldRenameAndReplaceOldSnippetsFile = true

const tags = [
  'ts',
  'js',
  'css',
  'html',
  'php',
  'json'
]

const languages = [
  'TypeScript',
  'JavaScript',
  'Ruby',
  'Python',
  'Java',
  'Kotlin',
  'Rust'
]

const langBaseGen = {
  TypeScript: (index, line) => `const s${index} = "snippet ${index}"; // line ${line}`,
  JavaScript: (index, line) => `const s${index} = "snippet ${index}"; // line ${line}`,
  Ruby: (index, line) => `s${index} = "snippet ${index}" # line ${line}`,
  Python: (index, line) => `s${index} = 'snippet ${index}' # line ${line}`,
  Java: (index, line) => `String s${index} = "snippet ${index}" // line ${line}`,
  Kotlin: (index, line) => `val s${index} = "snippet ${index}" // line ${line}`,
  Rust: (index, line) => `let mut s${index} = String::from("snippet ${index}") // line ${line}`
}

function getRandomElement (arr) {
  const index = Math.min(
    Math.floor(Math.random() * (arr.length)),
    arr.length - 1
  )
  return arr[index]
}

function generateSnippet (index, lang) {
  if (index < 3) {
    return langBaseGen[lang](index, 1)
  }

  const linesNum = Math.floor(Math.random() * 10) + 1
  let snippet = ''
  let i
  for (i = 1; i <= linesNum; i++) {
    snippet += `${langBaseGen[lang](index, i)}\n`
  }
  snippet += langBaseGen[lang](index, i)
  return snippet
}

/**
 * Utilties
 */

async function access (...args) {
  try {
    await fs.access(...args)
    return {
      hasAccess: true
    }
  } catch (err) {
    return {
      hasAccess: false,
      err
    }
  }
}

class IncrementFile {
  file
  basename
  lastIncrementVal = 0
  fileExtension
  incrementFunc

  constructor ({
    file,
    extension,
    incrementFunc,
    fileMapper
  }) {
    this.file = file
    this.fileExtension = extension || path.extname(file)
    this.dirname = path.dirname(file)
    this.basename = path.basename(file, this.fileExtension)
    this.incrementFunc = incrementFunc || ((dirname, basename, lastIncrementVal, fileExtension) => lastIncrementVal + 1)
    this.fileMapper = fileMapper || ((dirname, basenameWithNoExtension, increment, fileExtension) => path.join(dirname, `${basenameWithNoExtension}.${increment}${fileExtension}`))
  }

  increment () {
    this.lastIncrementVal = this.incrementFunc(this.dirname, this.basename, this.lastIncrementVal, this.fileExtension)
    return this.fileMapper(
      this.dirname,
      this.basename,
      this.lastIncrementVal,
      this.fileExtension
    )
  }
}

async function checkIfExistAndGetIncrement (file, {
  incrementOptions,
  returnAlreadyExistingFiles
} = {}) {
  const accessInfo = await access(file, fsc.F_OK)
  const alreadyExistingFiles = []

  if (accessInfo.hasAccess) {
    const incrementFile = new IncrementFile({ file, ...incrementOptions })

    const increment = async () => {
      const newFile = incrementFile.increment()

      const accessInfo = await access(newFile, fsc.F_OK)
      if (accessInfo.hasAccess) {
        if (returnAlreadyExistingFiles) {
          alreadyExistingFiles.push(newFile)
        }
        return increment()
      }
      return newFile
    }

    const noExistingIncrementFile = await increment()

    return {
      didExist: true,
      incrementFile: noExistingIncrementFile,
      alreadyExistingFiles
    }
  }
  return {
    didExist: false,
    incrementFile: file
  }
}

async function renameWithIncrement (src, out) {
  if (src === out) return null
  const checkAndIncrementInfo = await checkIfExistAndGetIncrement(out)
  const { incrementFile } = checkAndIncrementInfo
  await fs.rename(src, incrementFile)
  return checkAndIncrementInfo
}

async function writeFileWithIncrement (...args) {
  const file = args[0]
  const { incrementFile } = await checkIfExistAndGetIncrement(file)
  await fs.writeFile(incrementFile, ...args.slice(1))
}

function numKM (num) {
  const kNum = num / 1000

  if (kNum >= 1) {
    const mNum = kNum / 1000
    if (mNum >= 1) {
      return `${mNum}m`
    }
    return `${kNum}k`
  }

  return num
}

/**
 * Script
 * //////////////////////////////////////////////////////////////////
 */

/**
 * Generate snippets
 */
const nowTime = Date.now()
let currentTime = nowTime - timeDifference

const snippets = Array(dataSize).fill(true).map((__, i) => {
  currentTime += timeDifference

  if (i === 0) {
    return {
      'copy': 0,
      'tags': [`tag-${i}`, ..._.uniq([getRandomElement(tags), getRandomElement(tags)])],
      'key': uuid(),
      'createAt': currentTime,
      'updateAt': currentTime,
      'name': `Snippet number${i} another${i}`,
      'lang': 'Markdown',
      'value': '# Hello a markdown\n\nThiss is a js code:\n\n```js\nconst ok = new Snippet({ name });\n```\n\n\n\n\n\n\n\n\n\n',
      // 'description': `snippet ${i}\ntesting description\nanother too`
      'description': `\n`
    }
  }

  const lang = getRandomElement(languages)

  return {
    'copy': 0,
    'tags': [`tag-${i}`, ..._.uniq([getRandomElement(tags), getRandomElement(tags)])],
    'key': uuid(),
    'createAt': currentTime,
    'updateAt': currentTime,
    'name': `Snippet number${i} another${i}`,
    'lang': lang,
    'value': generateSnippet(i, lang),
    'description': `snippet ${i}`
  }
})

const snippetsJsonContent = JSON.stringify(snippets)

/**
 * Writing to file
 */

async function renameOldFile (snippetsFile) {
  const content = await fs.readFile(snippetsFile, { encoding: 'utf8' })
  const snippets = JSON.parse(content)
  const snippetsCount = snippets.length
  const outFile = `${outDir}/snippets.${numKM(snippetsCount)}.json`
  try {
    console.log('rename with incrementFile')
    const { incrementFile } = await renameWithIncrement(snippetsFile, outFile)
    console.log(`Old file snippets.json renamed to:\n${incrementFile}`)
  } catch (err) {
    throw err
  }
}

(async () => {
  if (shouldRenameAndReplaceOldSnippetsFile) {
    const snippetsFile = `${outDir}/snippets.json`
    const { hasAccess } = await access(snippetsFile)
    if (hasAccess) {
      try {
        console.log('file exists ======')
        await renameOldFile(snippetsFile)
      } catch (err) {
        console.log('Generation failed! while trying to rename snippets.json file!')
        console.log(err)
      }
    }
    const generatedFile = `${outDir}/snippets.json`
    try {
      await fs.writeFile(generatedFile, snippetsJsonContent, { encoding: 'utf8' })
      console.log('Snippets generated successfully at:')
      console.log(generatedFile)
    } catch (err) {
      console.log('Generation failed!')
      console.log(err)
    }
    return
  }

  try {
    const generatedFile = `${outDir}/snippets.${numKM(snippets.length)}.json`
    await writeFileWithIncrement(generatedFile, snippetsJsonContent, { encoding: 'utf8' })
    console.log('Snippets generated successfully at:')
    console.log(generatedFile)
  } catch (err) {
    console.log('Generation failed!')
    console.log(err)
  }
})()
