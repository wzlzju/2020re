/*
 * Calculating spatial autocorrelation coefficient
 * method: 
 * data: [[...],[...],...,[...]]  ([...] means multiple interesting attributes of a region)
 * adjlist: Map{id : Map{id : value}}
 * mode: 1: adjlist == weights
 *       2: adjlist == distance list
 * 
 * return: [...]: a list of LMI with length data.length
 *         []: empty list if there is any wrong
 */
function SAC(method, data, adjlist, mode){
    /* obtain weights */
    let weights
    switch(mode){
        case 1:
            weights = adjlist   // Wii == 0
            break
        case 2:
            weights = new Map()
            adjlist.forEach((distmap, id) => {
                let weightmap = new Map()
                //console.log(id,distmap)
                distmap.forEach((dist, aid) => {
                    if(aid == id) weightmap.set(id, 0)
                    else weightmap.set(aid, dist/(distmap.get(id)==0 ? 100 : distmap.get(id)))
                })
                weights.set(id, weightmap)
            })
            break
        default:
            console.error(`Illegal mode param in SAC. `)
            return []
            break
    }
    weights.forEach((weight,fid) => weight.forEach((value,tid) => {
        if(method != "GOstar" && tid == fid && value != 0){
            console.error(`Wii must be 0. `)
            return []
        }
        if(value < 0){
            console.error(`Wij must more than or equal 0. `)
            return []
        }
    }))
    //console.log(weights)

    /* check structure in data */
    data.forEach(v => {
        if(v.length != data[0].length){
            console.error(`Illegal data form in SAC. `)
            return []
        }
    })
    let weightslen = 0
    weights.forEach(() => weightslen++)
    if(weightslen != data.length){
        console.error(`Lengths of data and weights do not match. `)
        return []
    }
    weights.forEach((weight,id) => {
        let weightlen = 0
        weight.forEach(() => weightlen++)
        if(weightlen != data.length){
            console.error(`Lengths of data and weight in region %d do not match. `, id)
            return []
        }
    })

    /* standardize data */
    let sumv = []
    let meanv = []
    let stddata = JSON.parse(JSON.stringify(data))
    stddata.forEach(v => {
        if(sumv.length == 0) sumv = Object.assign([], v)
        else v.forEach((e,i) => sumv[i] += e)
    })
    sumv.forEach(e => meanv.push(e/stddata.length))
    stddata.forEach((v,i) => v.forEach((e,j) => stddata[i][j] -= meanv[j]))
    let stdvar = []
    stddata.forEach(v => {
        let tmpv = Object.assign([], v)
        tmpv.forEach((e,i) => tmpv[i] **= 2)
        if(stdvar.length == 0) stdvar = tmpv
        else tmpv.forEach((e,i) => stdvar[i] += e)
    })
    stdvar.forEach((e,i) => stdvar[i] /= stddata.length)
    stdvar.forEach((e,i) => stdvar[i] **= 0.5)
    stddata.forEach((v,i) => v.forEach((e,j) => stddata[i][j] /= stdvar[j]))
    //console.log(stddata)
    //console.log(data)

    /* calculate spatial autocorrelation */
    switch(method){
        case "LMI": return LMI(stddata, weights) 
                    break
        case "LGC": return LGC(stddata, weights) 
                    break
        case "GO": return GO(data, weights) 
                    break
        case "GOstar": return GOstar(stddata, weights) 
                    break
        default:    console.error(`Illegal method in SAC. `)
                    return []
                    break
    }
}


/*
 * Calculating Local Moran's I spatial autocorrelation coefficient
 */
function LMI(data, weights){
    /* calculate MI for each region(i) */
    let Zv = data 
    //console.log("Z: ",Zv)
    //console.log(weights)
    let LMIv = []
        /* LMI formular
         * Ii = Zi*sigma(j,Wij*Zj)/m2
         * m2 = sigma(i,Zi^2)/N
         */
    let m2 = 0
    Zv.forEach(zi => {
        zi.forEach(e => m2 += e*e)
    })
    m2 /= data.length
    //console.log("m2: ",m2)
    Zv.forEach((zi,i) => {
        let sigmaj = []
        Zv.forEach((zj,j) => {
            let tmpz = Object.assign([], zj)
            tmpz.forEach((e,idx) => tmpz[idx] *= weights.get(i).get(j))
            if(sigmaj.length == 0) sigmaj = tmpz
            else tmpz.forEach((e,idx) => sigmaj[idx] += e)
        })
        //console.log("Sigma j: ", sigmaj)
        let numerator = 0
        zi.forEach((e,idx) => numerator += e*sigmaj[idx])
        let Ii = numerator/m2

        /* normalization */
        let weightsum = 0
        weights.get(i).forEach(weight => weightsum += weight)
        Ii /= weightsum ? weightsum : 1

        LMIv.push(Ii)
    })
    //console.log(LMIv)

    return LMIv
}

/*
 * Calculating Local Geary's C spatial autocorrelation coefficient
 */
function LGC(data, weights){
    /* calculate GC for each region(i) */
    let Zv = data
    let LGCv = []
        /* LGC formular
         * Ci = sigma(j,Wij*(Zi-Zj)^2)
         * (Ci = Ci/k, This operation would keep the scale of the multivariate measure in line with the univariate measures. )
         */
    Zv.forEach((zi,i) => {
        let sigmaj = 0
        Zv.forEach((zj,j) => {
            let zimzj2 = 0
            let tmpz = Object.assign([], zi)
            tmpz.forEach((e,idx) => tmpz[idx] -= zj[idx])
            tmpz.forEach((e,idx) => tmpz[idx] *= tmpz[idx])
            tmpz.forEach(e => zimzj2 += e)
            sigmaj += weights.get(i).get(j)*zimzj2
        })
        //console.log("Sigma j: ", sigmaj)
        let Ci = sigmaj/Zv[0].length

        /* normalization */
        let weightsum = 0
        weights.get(i).forEach(weight => weightsum += weight)
        Ci /= weightsum ? weightsum : 1

        LGCv.push(Ci)
    })
    //console.log(LGCv)

    return LGCv
}

/*
 * Calculating Getis-Ord Statistics spatial autocorrelation coefficient
 * referring https://onlinelibrary.wiley.com/doi/pdf/10.1111/j.1538-4632.1992.tb00261.x
 * if data is standardized, Getis-Ord Statistics will be trapped
 * Hence, if not necessary, use Getis-Ord* instead
 * Even so, there might still be some pitfalls
 */
function GO(data, weights){
    /* calculate GO for each region(i) */
    //console.log(data)
    //console.log(weights)
    let Zv = data
    //console.log(Zv)
    let GOv = []
        /* GO formular
         * Gi = sigma(i!=j,Wij*Zj)/sigma(i!=j,Zj)
         */
    Zv.forEach((zi,i) => {
        let numerator = 0,
            denominator = 0
        Zv.forEach((zj,j) => {
            if(i != j){
                zj.forEach(e => {
                    numerator += weights.get(i).get(j)*e
                    denominator += e
                })
            }
        })
        //console.log(numerator, denominator)
        let Gi = numerator/denominator

        /* normalization */
        let weightsum = 0
        weights.get(i).forEach(weight => weightsum += weight)
        Gi /= weightsum ? weightsum : 1

        GOv.push(Gi)
    })
    //console.log(GOv)

    return GOv
}

/*
 * Calculating Getis-Ord* Statistics spatial autocorrelation coefficient
 */
function GOstar(data, weights){
    /* calculate GO* for each region(i) */
    //console.log(weights)
    let Zv = data
    let GOsv = []
        /* GO* formular
         * Gi* = sigma(j,Wij*Zj)/sigma(j,Zj)
         * with a constant denominator, Gi* can be considered as sigma(j,Wij*Zj)
         * other hand, data is standardized. sigma(j,Zj) is zero
         * Hence, we only remain the numerator here
         */
    let denominator = 0
    Zv.forEach(zi => zi.forEach(e => denominator += e))
    Zv.forEach((zi,i) => {
        let numerator = 0
        Zv.forEach((zj,j) => {
            zj.forEach(e => numerator += weights.get(i).get(j)*e)
        })
        //console.log(numerator, denominator)
        let Gis = numerator/denominator
        Gis = numerator

        /* normalization */
        let weightsum = 0
        weights.get(i).forEach(weight => weightsum += weight)
        //console.log(weightsum)
        Gis /= weightsum ? weightsum : 1

        GOsv.push(Gis)
    })
    //console.log(GOsv)

    return GOsv
}

module.exports = {
    SAC
}