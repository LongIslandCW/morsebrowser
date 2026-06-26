import ko from 'knockout'
// see https://getbootstrap.com/docs/5.0/getting-started/webpack/
import 'bootstrap/dist/css/bootstrap.min.css'
// You can specify which plugins you need
// Note that even though these don't seem to be used directly,
// they are used by the accordian.
// eslint-disable-next-line no-unused-vars
import { Tooltip, Toast, Popover } from 'bootstrap'
import './css/style.css'
import './css/dark-mode.css'
import { applyTheme, readDarkModeFromCookie } from './morse/theme/theme.ts'
import { MorseViewModel } from './morse/morse.ts'

applyTheme(readDarkModeFromCookie())

ko.applyBindings(new MorseViewModel())
