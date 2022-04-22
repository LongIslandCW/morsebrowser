import ko from 'knockout'
// see https://getbootstrap.com/docs/5.0/getting-started/webpack/
import 'bootstrap/dist/css/bootstrap.min.css'
// You can specify which plugins you need
// Note that even though these don't seem to be used directly,
// they are used by the accordian.
// eslint-disable-next-line no-unused-vars
import { Tooltip, Toast, Popover } from 'bootstrap'
import { MorseViewModel } from './morse/morse'

ko.applyBindings(new MorseViewModel())
