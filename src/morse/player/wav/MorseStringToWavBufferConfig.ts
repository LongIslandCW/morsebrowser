export class MorseStringToWavBufferConfig {
  word
  wpm
  fwpm
  ditFrequency
  dahFrequency
  prePaddingMs
  xtraWordSpaceDits
  volume
  get frequency () { return this.ditFrequency }
}
