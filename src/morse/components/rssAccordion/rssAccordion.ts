import { MorseViewModel } from '../../morse'
import imageTemplate from './rssAccordion.html'
class RssAccordion {
  vm:MorseViewModel
  constructor (params) {
    this.vm = params.root
    // console.log(this.vm)
    // console.log(params)
  }
}
// https://keepinguptodate.com/pages/2019/12/using-typescript-with-knockout/
export default { viewModel: RssAccordion, template: imageTemplate }
