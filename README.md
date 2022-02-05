# morse_browser

What is this?

Basically my own customized version of https://morsecode.world/international/trainer/generator.html (and by the way, 
please note that the text-to-sound is handled by .js libraries available here: https://github.com/scp93ch/morse-pro)

If you just want to use it, download the /dist directory and open morse.htm in your browser.

I cobbled it together using knockout.js because I think knockout is fairly approachable by amateur programmer hams,
compare to other javascript frameworks.

With respect to the morse-pro library, don't ask me why I converted some to typescript. I later just decided to let webpack
create a bundle and call it a day.

npx webpack --config webpack.config.js
