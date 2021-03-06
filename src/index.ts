const utils = require('./utilities');
const colors = require('cli-color');
const clear = require('cli-clear');
const moment = require('moment');
const fetch = require('node-fetch');

import fonts from './fonts';

class Clock {
  public rows: number;
  public columns: number;

  public availableSets: Array<string[]> = [['•', 'X'], ['\\', '/'], ['-', '_'], ['0', '1'], [' ', '█']];
  public currentSet: string[];
  public font;

  public fc: string = 'white';
  public bc: string = 'black';

  public coin: string = '';

  public twelveHourFormat: boolean = true;

  public buffer: Array<number[]> = [];

  constructor(args) {
    this.setSize();
    this.setColors(args);
    this.setSet(args);
    this.setFont();
    if (args.coin) {
      this.setCoin(args);
    } else {
      this.setFormat(args);
    }
  }

  public setCoin(args): void {
      if (args.coin && typeof args.coin === 'string') {
        const acceptedCryptos = ['BTC', 'ETH', 'LTC'];
        const acceptedCurrencies = ['AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN', 'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BIF', 'BMD', 'BND', 'BOB', 'BRL', 'BSD', 'BTC', 'BTN', 'BWP', 'BYN', 'BYR', 'BZD', 'CAD', 'CDF', 'CHF', 'CLF', 'CLP', 'CNY', 'COP', 'CRC', 'CUC', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EEK', 'EGP', 'ERN', 'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GGP', 'GHS', 'GIP', 'GMD', 'GNF', 'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 'IMP', 'INR', 'IQD', 'ISK', 'JEP', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL', 'LTL', 'LVL', 'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRO', 'MTL', 'MUR', 'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR', 'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR', 'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SEK', 'SGD', 'SHP', 'SLL', 'SOS', 'SRD', 'SSP', 'STD', 'SVC', 'SZL', 'THB', 'TJS', 'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD', 'UYU', 'UZS', 'VEF', 'VND', 'VUV', 'WST', 'XAF', 'XAG', 'XAU', 'XCD', 'XDR', 'XOF', 'XPD', 'XPF', 'XPT', 'YER', 'ZAR', 'ZMK', 'ZMW', 'ZWL'];
        const givenPair = args.coin.split('-');
        if (acceptedCryptos.indexOf(givenPair[0]) > -1 && acceptedCurrencies.indexOf(givenPair[1]) > -1) {
          this.coin = args.coin;
        } else {
          console.log(`Not an accepted currency pair`);
          process.exit();
        }
      } else {
        console.log(`Not an accepted currency pair`);
        process.exit();
      }
  }

  public setColors(args): void {
    if (args.colors) {
      if (colors[args.colors[0]]) {
        this.fc = args.colors[0];
      }

      if (colors[args.colors[1]]) {
        this.bc = args.colors[1];
      }
    }
  }

  public setFont(): void {
    this.font = fonts.atascii;
  }

  public setFormat(args): void {
    this.twelveHourFormat = args.twelveHours;
  }

  /**
   * Sets the set of characters to use for both the foreground
   * and background
   */
  public setSet(args): void {
    this.currentSet = this.availableSets[utils.getRandom(this.availableSets)];
    // randomly reverse the array, so we can have a random BG and FG
    if (Math.round(Math.random())) {
      this.currentSet = this.currentSet.reverse();
    }

    if (args.background) {
      this.currentSet[0] = args.background;
    }

    if (args.foreground) {
      this.currentSet[1] = args.foreground;
    }

    this.currentSet[0] = colors[this.bc](this.currentSet[0]);
    this.currentSet[1] = colors[this.fc](this.currentSet[1]);
  }

  public setSize(): void {
    if (process.stdout.rows && process.stdout.rows) {
      this.rows = process.stdout.rows;
      this.columns = process.stdout.columns;
    } else {
      this.rows = 20;
      this.columns = 50;
    }
  }

  // returns the size of the first character in a set
  public getLetterDimensions(character): {height: number, padding: number, width: number} {
    return {
      height: character.length,
      padding: 1,
      width: character[0].split('').length
    }
  }

  public getTotalWidth(numOfChars: number = 5): number {
    return (this.font.width + (this.font.padding * 2)) * numOfChars;
  }

  public getTotalHeight(): number {
    return (this.font.height + (this.font.padding * 2));
  }

  /**
   * Fill the background with zeros aka the background character
   */
  public setBg(): void {
    // cycle through all the columns putting a zero on every column
    // rows then columns
    this.buffer = [];
    for (let i = 0; i < this.rows; i++) {
      this.buffer[i] = [];
      for (let h = 0; h < this.columns; h++) {
        this.buffer[i][h] = 0;
      }
    }
  }

  /**
   * Get the numbers that will be displayed. Will come from the time object
   */
  public getTime(): string[] {
    let timeFormat: string = 'HH:mm';
    let separatorIndex: number = 2;
    if (this.twelveHourFormat) {
      timeFormat = 'h:mm';
      separatorIndex = 1;
    }

    return this.convertDataToArr(moment().format(timeFormat), separatorIndex);
  }

  public convertDataToArr(data: string, separatorIndex: number, separatorType: string = 'colon'): string[] {
    let dataArr: string[] = data.split('');

    dataArr[separatorIndex] = separatorType;
    return dataArr;
  }

  /**
   * Replace the appropriate background characters with the foreground ones
   */
  public setFg(): void {
    if (this.coin) {
    fetch(`https://api.coinbase.com/v2/prices/${this.coin}/spot`)
      .then((res) => {
        return res.text();
      })
      .then((body) => {
        const parsedData = JSON.parse(body);
        if (parsedData.err) throw Error(parsedData.err.message);
        let separatorIndex = parsedData.data.amount.indexOf('.');
        this.draw(this.getNewBufferWithData(this.convertDataToArr(parsedData.data.amount, separatorIndex, 'dot')));
      })
      .catch((e) =>{
        console.log('something went wrong while getting the data from bitcoin', e);
      });
    } else {
      this.draw(this.getNewBufferWithData(this.getTime()));
    }
  }

  public getNewBufferWithData(numToDisplay: string[]): number[][] {
    let startingLeftIndex: number = 0;
    const totalTextWidth = this.getTotalWidth(numToDisplay.length);

    const terminalHorCenter = Math.floor(this.columns / 2);
    let terminalOffset = terminalHorCenter - Math.floor(totalTextWidth / 2);

    const terminalVerCenter = Math.floor(this.rows / 2);
    const terminalVerOffset = terminalVerCenter - Math.floor(this.font.height / 2);

    if (numToDisplay.length === 4) {
      terminalOffset += this.font.width;
    }

    let buffer = Array.from(this.buffer);

    // cycle through the time numbers
    for (let h = startingLeftIndex; h < numToDisplay.length; h++) {
      const leftIndex = (h * (this.font.width + (this.font.padding * 2))) + terminalOffset;

      // cycle through the height of the numbers
      for (let i = 0; i < this.font.height; i++) {

        // the row from the number to cycle through
        const currentChar = this.font.characters[numToDisplay[h]];
        const thisRow = currentChar[i].split('');

        // replace the sections of the buffer with the section from the number
        buffer[terminalVerOffset + i].splice(leftIndex, thisRow.length, ...thisRow);
      }
    }

    return buffer;
  }

  /**
   * Helper to Clear out the background
   */
  public clear(): void {
    clear();
  }

  /**
   * Update the buffer
   */
  public update(): void {
    this.setSize();
    this.setBg();
    this.setFg();
  }

  /**
   * draw out the buffer from `bufferToWrite`
   */
  public draw(bufferToWrite: number[][]): void {
    let toPaint = '';

    bufferToWrite.forEach((row) => {
      let currentRow = row.reduce((prev, curr) => {
        return prev + this.currentSet[curr];
      }, '');

      toPaint += '\n' + currentRow;
    });

    this.clear();
    process.stdout.write(toPaint);
  }
}

module.exports = Clock;
