"use strict";
require("dotenv-safe").config();
const OpenCC = require("opencc");
// const trad_to_simp = converter.convertToSimplifiedChinese;
// const simp_to_trad = OpenCC.convertToTraditionalChinese;


/**
 * Simplified to Traditional Chinese
 * @param {string} inText
 */
const simp_to_trad = (inText) => {
    if (inText) {
        const converter = new OpenCC('s2t.json');
        return converter.convertSync(inText);
    } else {
        console.log("Nothing to convert");
    }
};

/**
 * Traditional to Simplified Chinese
 * @param {string} inText
 */
const trad_to_simp = (inText) => {
    if (inText) {
        const converter = new OpenCC('t2s.json');
        return converter.convertSync(inText);
    } else {
        console.log("Nothing to convert");
    }
};

/**
 * Simplified to Traditional Chinese
 * @param {string} inText
 */
const test = async (inText) => {
    const converter = new OpenCC('s2t.json');
    let result = await converter.convertPromise(inText);
    console.log(result);
    console.log(typeof result);
    return result;
};

// Async API with Promise
const demo = () => {
    opencc.convertPromise("汉字").then(converted => {
        console.log(converted);
    });
};

exports.simp_to_trad = simp_to_trad;
exports.trad_to_simp = trad_to_simp;
exports.test = test;