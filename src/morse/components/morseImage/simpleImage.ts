import { MorseViewModel } from '../../morse'
import imageTemplate from './simpleImageTemplate.html'
class SimpleImageTemplate {
  height:number
  width:number
  src:string
  labelText:string
  constructor (params) {
    // console.log(params)
    this.height = params.height
    this.width = params.width
    this.labelText = `${params.labelText}`
    this.src = (params.root as MorseViewModel).morseLoadImages().getSrc(params.icon)
  }
}
// https://keepinguptodate.com/pages/2019/12/using-typescript-with-knockout/
export default { viewModel: SimpleImageTemplate, template: imageTemplate }
