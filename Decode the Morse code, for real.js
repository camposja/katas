/**
 * Created by v on 7/10/17.
 */
const DEBUG = false
const debugLog = DEBUG?console.log.bind(console):()=>{}

const beeplengths = [".", "-"]
const pauseLengths = ["", " ", "   "]

const closestClusterIndex = (observation, clusterMeans) => {
  return clusterMeans.map((mean, index)=>({
    distance: Math.abs(mean - observation),
    index
  })).reduce((acc, curr)=>(acc.distance >= curr.distance) ? curr : acc).index
}

const spread = (means, observations)=> {

  const retval = observations.reduce((acc, observation)=> {
    //console.log({means,observation,closestMean:means[closestClusterIndex(observation,means)],add: Math.abs(means[closestClusterIndex(observation,means)]-observation)})
    return acc + Math.pow(means[closestClusterIndex(observation, means)] - observation,2)
  }, 0)
  if(!retval)
    debugLog('wtf')
  return retval
}


const KMeansCluster = (observations, numberOfClusters, lengths, maxLength) => {
  const maxObsLength = maxLength > 7 ? maxLength : 7
  let means = Array.from(Array(numberOfClusters)).map((item, index)=>lengths[index] * maxObsLength / 7); // This has to more clever!!!
  //console.log({ means })
  let membersArray = Array.from(Array(numberOfClusters)).map(i=>[])
  let newMembersArray = Array.from(Array(numberOfClusters)).map(i=>[])
  let previousMeans = [];
  let turns = 0
  do {
    turns++;
    previousMeans = means.slice()
    membersArray = means
      .map((clusterMembers, clusterIndex)=>observations
        .reduce((acc, observation)=>
            closestClusterIndex(observation, means)
            === clusterIndex ? acc.concat([observation]) : acc
          , []))// Filter observations where the closest mean is the current one.;
    means = membersArray.map(
      (clusterMembers, clusterIndex) => clusterMembers.length ? clusterMembers.reduce((a, b)=>a + b, 0) / clusterMembers.length : lengths[clusterIndex] * maxObsLength / 7)
    newMembersArray = means
      .map((clusterMembers, clusterIndex)=>observations
        .reduce((acc, observation)=>
            closestClusterIndex(observation, means)
            === clusterIndex ? acc.concat([observation]) : acc
          , []))// Filter observations where the closest mean is the current one.
    //console.log({membersArray, newMembersArray})
  } while (!newMembersArray.reduce((acc, newMembers, meanIndex) => acc && newMembers
      .reduce((memberAcc, member, memberIndex)=>memberAcc && (membersArray[meanIndex][memberIndex] !== undefined && membersArray[meanIndex][memberIndex] === member), true)
    , true))
  debugLog({ previousMeans, turns, means,spread: spread(means,observations) })
  debugLog('\n')
  return previousMeans
}
const decodeBitsAdvanced = (bits) => {
  //console.log({bits})
  if (!bits || !bits.replace(/^0+/, '')) return ''
  const observations = bits.replace(/^0+/, '').replace(/0+$/, '').match(/0+|1+/g)
  const maximalObservationLengts = Math.max(...observations.map(o=>o.length))
  const minimalObservationLengts = Math.min(...observations.map(o=>o.length))
  const obsLengt = maximalObservationLengts
  /*const beepMeans = KMeansCluster(observations.filter(item=>item[0]==1).map(i=>i.length),2,[1,3],maximalObservationLengts)
   const pauseMeans = KMeansCluster(observations.filter(item=>item[0]==0).map(i=>i.length),3,[1,3,7],maximalObservationLengts)*/

  const means =
    [
      KMeansCluster(observations.map(i=>i.length), 3, [1, 3, 7], maximalObservationLengts * 7),
      KMeansCluster(observations.map(i=>i.length), 3, [1, 3, 7], maximalObservationLengts * 7/3),
      KMeansCluster(observations.map(i=>i.length), 3, [1, 3, 7], maximalObservationLengts),
      KMeansCluster(observations.map(i=>i.length), 3, [1, 3, 7], minimalObservationLengts * 7),
      KMeansCluster(observations.map(i=>i.length), 3, [1, 3, 7], minimalObservationLengts * 7/3),
      KMeansCluster(observations.map(i=>i.length), 3, [1, 3, 7], minimalObservationLengts),
    ].reduce((acc, curr)=>
      spread(curr, observations.map(i=>i.length))
      < spread(acc, observations.map(i=>i.length))
        ? curr : acc)
  //console.log({bestMeans:means})
  return observations.map(observation => observation[0] == 1
    ? beeplengths[closestClusterIndex(observation.length, means.slice(0,2))]
    : pauseLengths[closestClusterIndex(observation.length, means)]).join("").trim()
}

const decodeMorse = (morseCode) => {
  if (!morseCode) return ''
  return morseCode.split("   ").map(i=>i.split(" ").map(morse=>MORSE_CODE[morse]).join("")).join(" ").trim()
}


const MORSE_CODE = {
  '.-': 'A',
  '-...': 'B',
  '-.-.': 'C',
  '-..': 'D',
  '.': 'E',
  '..-.': 'F',
  '--.': 'G',
  '....': 'H',
  '..': 'I',
  '.---': 'J',
  '-.-': 'K',
  '.-..': 'L',
  '--': 'M',
  '-.': 'N',
  '---': 'O',
  '.--.': 'P',
  '--.-': 'Q',
  '.-.': 'R',
  '...': 'S',
  '-': 'T',
  '..-': 'U',
  '...-': 'V',
  '.--': 'W',
  '-..-': 'X',
  '-.--': 'Y',
  '--..': 'Z',
  '-----': '0',
  '.----': '1',
  '..---': '2',
  '...--': '3',
  '....-': '4',
  '.....': '5',
  '-....': '6',
  '--...': '7',
  '---..': '8',
  '----.': '9',
  '.-.-.-': '.',
  '--..--': ',',
  '..--..': '?',
  '.----.': '\'',
  '-.-.--': '!',
  '-..-.': '/',
  '-.--.': '(',
  '-.--.-': ')',
  '.-...': '&',
  '---...': ':',
  '-.-.-.': ';',
  '-...-': '=',
  '.-.-.': '+',
  '-....-': '-',
  '..--.-': '_',
  '.-..-.': '"',
  '...-..-': '$',
  '.--.-.': '@',
  '...---...': 'SOS'
}
const messages = {
  'HEY JUDE': '0000000011011010011100000110000001111110100111110011111100000000000111011111111011111011111000000101100011111100000111110011101100000100000',
  'E': '000000000000001111110000000000000000000000',
  "Empty": '',
  'shortE': '11',
  'M': '00000000000000000111011100000000',
  'EE': '1001',
  'E E': '10000001',
  'Nervous': { bits: '00000000000000011111111000000011111111111100000000000111111111000001111111110100000000111111111111011000011111111011111111111000000000000000000011111111110000110001111111111111000111000000000001111111111110000111111111100001100111111111110000000000111111111111011100001110000000000000000001111111111010111111110110000000000000001111111111100001111111111110000100001111111111111100000000000111111111000000011000000111000000000000000000000000000011110001111100000111100000000111111111100111111111100111111111111100000000011110011111011111110000000000000000000000111111111110000000011111000000011111000000001111111111110000000001111100011111111000000000111111111110000011000000000111110000000111000000000011111111111111000111001111111111001111110000000000000000000001111000111111111100001111111111111100100000000001111111100111111110111111110000000011101111111000111000000001001111111000000001111111111000000000111100001111111000000000000011111111100111111110111111111100000000000111111110000001100000000000000000000111111101010000010000001111111100000000011111000111111111000000111111111110011111111001111111110000000011000111111110000111011111111111100001111100001111111100000000000011110011101110001000111111110000000001111000011111110010110001111111111000000000000000000111111111110000000100000000000000000011110111110000001000011101110000000000011111111100000011111111111100111111111111000111111111000001111111100000000000001110111111111111000000110011111111111101110001111111111100000000111100000111100000111111111100000111111111111000000011111111000000000001000000111100000001000001111100111111111110000000000000000000010001111111100000011111111100000000000000100001111111111110111001111111111100000111111100001111111111000000000000000000000000011100000111111111111011110000000010000000011111111100011111111111100001110000111111111111100000000000000111110000011111001111111100000000000011100011100000000000011111000001111111111101000000001110000000000000000000000000000111110010000000000111111111000011111111110000000000111111111111101111111111100000000010000000000000011111111100100001100000000000000111100111100000000001100000001111111111110000000011111111111000000000111100000000000000000000111101111111111111000000000001111000011111000011110000000001100111111100111000000000100111000000000000111110000010000011111000000000000001111111111100000000110111111111100000000000000111111111111100000111000000000111111110001111000000111111110111111000000001111000000000010000111111111000011110001111111110111110000111111111111000000000000000000000000111111111110000000111011111111100011111110000000001111111110000011111111100111111110000000001111111111100111111111110000000000110000000000000000001000011111111110000000001111111110000000000000000000000011111111111111000000111111111000001111111110000000000111111110000010000000011111111000011111001111111100000001110000000011110000000001011111111000011111011111111110011011111111111000000000000000000100011111111111101111111100000000000000001100000000000000000011110010111110000000011111111100000000001111100011111111111101100000000111110000011110000111111111111000000001111111111100001110111111111110111000000000011111111101111100011111111110000000000000000000000000010000111111111100000000001111111110111110000000000000000000000110000011110000000000001111111111100110001111111100000011100000000000111110000000011111111110000011111000001111000110000000011100000000000000111100001111111111100000111000000001111111111000000111111111100110000000001111000001111111100011100001111111110000010011111111110000000000000000000111100000011111000001111000000000111111001110000000011111111000100000000000011111111000011001111111100000000000110111000000000000111111111111000100000000111111111110000001111111111011100000000000000000000000000' }.bits
}
console.log(Object.keys(messages).map((item)=>`key:${item}, value:${decodeMorse(decodeBitsAdvanced(messages[item]))}`))
//console.log(decodeMorse(decodeBitsAdvanced(messages['Nervous'])))