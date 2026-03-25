import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const SVG_DIR = path.resolve(__dirname, '../assets/icons/svg')
const COMPONENT_DIR = path.resolve(__dirname, '../assets/icons/iconComponent')
const COMPONENT_DIR_INDEX = path.resolve(__dirname, '../assets/icons')

if (!fs.existsSync(COMPONENT_DIR)) {
  fs.mkdirSync(COMPONENT_DIR, { recursive: true })
}

const toPascalCase = (str: string) => {
  return str
    .replace(/(^\w|-\w)/g, (g) => g.replace('-', '').toUpperCase())
    .replace(/\.svg$/, '')
}

const transformSvg = (svg: string) => {
  let result = svg

  result = result.replace(/width="[^"]*"/, 'width="1em"')
  result = result.replace(/height="[^"]*"/, 'height="1em"')

  result = result.replace(/fill="[^"]*"/g, 'fill="none"')
  result = result.replace(/stroke="[^"]*"/g, 'stroke="currentColor"')

  // FIX React SVG attributes
  result = result.replace(/stroke-width/g, 'strokeWidth')
  result = result.replace(/stroke-linecap/g, 'strokeLinecap')
  result = result.replace(/stroke-linejoin/g, 'strokeLinejoin')
  result = result.replace(/clip-rule/g, 'clipRule')
  result = result.replace(/fill-rule/g, 'fillRule')

  return result
}

const generateIcons = () => {
  const files = fs.readdirSync(SVG_DIR).filter((file) => file.endsWith('.svg'))

  files.forEach((file) => {
    const filePath = path.join(SVG_DIR, file)
    const svgRaw = fs.readFileSync(filePath, 'utf8')
    const baseName = toPascalCase(file)
    const svgProcessed = transformSvg(svgRaw)

    // Sửa nội dung file lẻ: Dùng Named Export thay vì Default Export
    const componentContent = `
import Icon from '@ant-design/icons';
import type { CustomIconComponentProps } from '@ant-design/icons/lib/components/Icon';

const ${baseName}Svg = () => (
  ${svgProcessed}
);

export const Icon${baseName} = (props: Partial<CustomIconComponentProps>) => (
  <Icon component={${baseName}Svg} {...props} />
);
`.trim()

    fs.writeFileSync(
      path.join(COMPONENT_DIR, `${baseName}.tsx`),
      componentContent,
    )
  })

  // Sửa nội dung file index.tsx: Export trực tiếp từ các file thành phần
  const indexContent = files
    .map((file) => {
      const name = toPascalCase(file)
      // Export theo cú pháp: export { IconName } from './path'
      return `export { Icon${name} } from './iconComponent/${name}';`
    })
    .join('\n')

  fs.writeFileSync(path.join(COMPONENT_DIR_INDEX, 'index.tsx'), indexContent)

  console.log('✅ Generated icons with Named Exports for Tree Shaking!')
}

generateIcons()
