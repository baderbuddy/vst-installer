var dmg = require('dmg');
var fs = require('fs');
var path = require("path");
var ncp = require('ncp').ncp;

function DMGMount(myDmg) {
    var promise = new Promise((resolve, reject) => {
        dmg.mount(myDmg, (err, path) => {
            if (err) {
                reject(err);
            }
            else {
                resolve(path);
            }
        })
    });
    return promise;
}

function copyFolder(source, destination) {
    if (source[0] === '~') {
        source = path.join(process.env.HOME, source.slice(1));
    }
    if (destination[0] === '~') {
        destination = path.join(process.env.HOME, destination.slice(1));
    }

    console.log(source);
    var promise = new Promise((resolve, reject) => {
        ncp(source, destination, function (err) {
            if (err) {
                console.log(err);
                reject(err);
            }
            else {
                console.log("Success!? " + destination)
                resolve();
            }
        });
    });
    return promise;
}

function closeDMG(path) {
    var promise = new Promise((resolve, reject) => {
        dmg.unmount(path, function (err) {
            if (err) {
                reject(err);
            }
            else {
                resolve();
            }
        });
    });
    return promise;
}
const timeout = ms => new Promise(res => setTimeout(res, ms))


async function OpenDMG(relativePath) {
    // path must be absolute and the extension must be .dmg
    if (relativePath[0] === '~') {
        relativePath = path.join(process.env.HOME, relativePath.slice(1));
    }

    var myDmg = await path.resolve(relativePath);
    var returnPath = await DMGMount(myDmg);
    // to open & mount the dmg
    const ignoredExtensions = [".Trashes", ".rtf", ".txt", ".pdf", "VST3", "VST", "VST Plugins", "VST"]
    var filesInDmg = fs.readdirSync(returnPath);
    var goodToGo = true;
    for (var i = 0; i < filesInDmg.length; i++) {
        var file = filesInDmg[i];
        if (ignoredExtensions.filter((ext) => {
            return file.endsWith(ext) && (ext[0] === "." || ext === file);
        
        }).length) {

        }
        else if (file.endsWith(".vst")) {
            console.log(returnPath);
            await copyFolder(returnPath + "/" + file, "~/Library/Audio/Plug-Ins/VST/" + file )
        }
        else if (file.endsWith(".vst3")) {
            console.log(returnPath);
            await copyFolder(returnPath + "/" + file, "~/Library/Audio/Plug-Ins/VST3/" + file )
        }
        else {
            console.log(file);
            goodToGo = false;
        }
    }
    console.log(filesInDmg);
    await timeout(1000)
    await closeDMG(returnPath);
    console.log(goodToGo);
    return goodToGo;
}

async function ProcessAllDMG(relativePath) {
    if (relativePath[0] === '~') {
        relativePath = path.join(process.env.HOME, relativePath.slice(1));
    }
    var filesInPath = fs.readdirSync(relativePath);
    for (var i = 0; i < filesInPath.length; i++) {
        var currentFile = filesInPath[i];
        if (currentFile.startsWith(".")) {

        }
        else if (!(await OpenDMG(relativePath + "/" + currentFile))) {
            console.log("Failure");
            throw "Failed!"
        }
        console.log("Moving on ");
    }
}
ProcessAllDMG('~/Downloads/ToInstallVST');

//