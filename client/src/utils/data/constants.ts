import { SelectOptionType } from "../../uis/MarkOption"

export const MarkStages = [1, 2, 3, 4, 5]
export const MarkTATips: {[key in number]: string}={
    1:"Responds to the task only in a minimal way or the response is tangential | Some main ideas are presented but they are difficult to identify and may be irrelevant, repetitive and/or not well supported | Format may be inappropriat",
    2:"Addresses the task only partially due to irrelevancies or omissions | The response to the question may lack clear development and/or there may be no conclusions drawn | Presents some main ideas but these are limited and insufficiently developed | There may be irrelevant detail | Format may be inappropriate in places",
    3:"Addresses all parts of the task although some parts may be more fully covered than others | A relevant response to the question although the conclusions may become unclear or repetitive | Presents relevant main ideas but some may be inadequately developed/unclear",
    4:"Addresses all parts of the task | A relevant response to the question with ideas clearly presented, extended and supported, but there may be a tendency to overgeneralis",
    5:"Sufficiently addresses all parts of the task | A well-developed response to the question with relevant, extended and supported ideas | Ideas are clearly developed & fully supported with relevant evidence",
}
export const MarkGRATips: {[key in number]: string}={
    1:"Very limited range of sentence types and structures used | Subordinate clauses seldom used | Frequent errors in grammar and punctuation",
    2:"Uses a limited range of sentence types and structures | Complex sentences are attempted but most accuracy occurs in simple sentences and formulaic language | There may be frequent errors in grammar and punctuation and errors may impede communication",
    3:"Uses a mix of simple and complex sentence types and structures | Errors in grammar and punctuation occur but these rarely impede communication",
    4:"Uses a range of both simple and complex structures | Error free sentences are frequent | Good control of grammar and punctuation but a few non-impeding errors may occur mostly in more complex structures",
    5:"Very competent use of a wide range of structures, both simple and complex | Majority of sentences are error free though occasional minor and unobtrusive errors in grammar and punctuation may occur",
}
export const MarkVOCTips: {[key in number]: string}={
    1:"Uses a basic range of vocabulary which may be used repetitively or may be inappropriate for the task | Limited awareness of appropriate register | Frequent word choice errors and limited control of word formation &/or spelling cause strain for the reader",
    2:"Uses a limited range of vocabulary, but this is minimally adequate for the task | Register and style may be inappropriate | There may be obvious inaccuracies with word choice, word formation &/or spelling which may impede communication of meaning",
    3:"Uses a satisfactory range of vocabulary for the task | Attempts to use less common vocabulary but with some inaccuracy | Register and style may be inappropriate in places | There are some inaccuracies in word choice, word formation &/or spelling but these rarely impede communication",
    4:"Uses a sufficient range of vocabulary to allow some flexibility and precision | Uses some less common vocabulary with some awareness of style and collocation | Register and style of vocabulary are largely appropriate | Occasional errors in word choice, spelling &/or word formation",
    5:"Uses a wide range of vocabulary fluently and flexibly to convey precise meanings | Skilfully uses uncommon lexical items but there may be occasional inaccuracies in word choice and collocation | Register and style are appropriate | Errors in spelling & /or word formation are rare",
}
export const MarkCOCOTips: {[key in number]: string}={
    1:" Information and ideas are not organised logically and coherently and there is no clear progression. | Some basic cohesive devices used but they may be repetitive and/or inaccurate. | Paragraphing is not adequate or logical",
    2:"Information and ideas are not organised coherently and there may be a lack of overall progression | Paragraphing may be absent, inadequate and/or illogical | Cohesive devices may be inadequate, inaccurate, or overused | Referencing and substitution may be inadequate and/or unclear",
    3:"Information and ideas are organised coherently and there is a clear overall progression | Paragraphing is used but not always logically | Cohesive devices are used and generally make relationships between ideas clear, but cohesion within and/or between sentences may be faulty or mechanical in places | Referencing may not always be clear and/or appropriate",
    4:"Information and ideas are logically organised and there is a clear progression throughout | Each paragraph contains a clear central topic | A range of cohesive devices is used appropriately to make relationships between ideas clear although there may be some under-/over-use",
    5:"Manages all aspects of cohesion well | Information and ideas are logically sequenced | Paragraphing is used sufficiently and appropriately. | Uses a wide variety of appropriate cohesive devices to make all relationships between ideas clear",
}

export const MarkTips: {[key in SelectOptionType]:{[key in number]: string} } = {
    ta: MarkTATips,
    gra: MarkGRATips,
    voc: MarkVOCTips,
    coco: MarkCOCOTips,
}

export const getValueColor = (value: number | undefined):string =>{
  return value !== undefined? (value <=2 ? 'text-red-400 font-bold': value >4 ? 'text-green-400 font-bold' : '' ): '';
}