
function calculatePercentages(data) {
    const solarGeneration = Number(data.solar);
  const gensetGeneration = Number(data.genset);
  const mainsGeneration = Number(data.mains);
    
    const totalGeneration = solarGeneration + gensetGeneration + mainsGeneration;

   // console.log(totalGeneration)
  
  
    let percentages = [
      (solarGeneration / totalGeneration) * 100,
      (mainsGeneration / totalGeneration) * 100,
      (gensetGeneration / totalGeneration) * 100,
    ];
  
   // console.log(percentages)
    const totalPercentage = percentages.reduce((acc, val) => acc + val, 0);

    if (totalPercentage !== 100) {
      const adjustment = 100 - totalPercentage;
      percentages[percentages.length - 1] += adjustment;
    }
  
    return {
      labels: ["Solar", "Mains", "Genset"],
      values: percentages.map(p => Math.round(p))
    };
  }

  const calculateAverageCurrent = (alldata) => {
    const allValues = [
      Number(alldata.solar.current.phase1),
      Number(alldata.solar.current.phase2),
      Number(alldata.solar.current.phase3),
      Number(alldata.genset.current.phase1),
      Number(alldata.genset.current.phase2),
      Number(alldata.genset.current.phase3),
      Number(alldata.mains.current.phase1),
      Number(alldata.mains.current.phase2),
      Number(alldata.mains.current.phase3),
    ];
  
    const filteredValues = allValues.filter(val => val !== 0);

    if (filteredValues.length === 0) {
      const clusterAverage = 0;
      return clusterAverage;
    }
  
    const arithmeticMean = filteredValues.reduce((acc, val) => acc + val, 0) / filteredValues.length;
  
    const clusterAverage = Math.round(arithmeticMean);
  
    return clusterAverage;
  };

  const calculateAverageVoltageL_L = (alldata) => {
    const allValues = [
      Number(alldata.solar.voltagel.phase1),
      Number(alldata.solar.voltagel.phase2),
      Number(alldata.solar.voltagel.phase3),
      Number(alldata.genset.voltagel.phase1),
      Number(alldata.genset.voltagel.phase2),
      Number(alldata.genset.voltagel.phase3),
      Number(alldata.mains.voltagel.phase1),
      Number(alldata.mains.voltagel.phase2),
      Number(alldata.mains.voltagel.phase3),
    ];
  
    const filteredValues = allValues.filter(val => val !== 0);

    if (filteredValues.length === 0) {
      const clusterAverage = 0;
      return clusterAverage;
    }
  
    const arithmeticMean = filteredValues.reduce((acc, val) => acc + val, 0) / filteredValues.length;
  
    const clusterAverage = Math.round(arithmeticMean);
  
    return clusterAverage;
  };

  const calculateAverageVoltageL_N = (alldata) => {
    const allValues = [
      Number(alldata.solar.voltagen.phase1),
      Number(alldata.solar.voltagen.phase2),
      Number(alldata.solar.voltagen.phase3),
      Number(alldata.genset.voltagen.phase1),
      Number(alldata.genset.voltagen.phase2),
      Number(alldata.genset.voltagen.phase3),
      Number(alldata.mains.voltagen.phase1),
      Number(alldata.mains.voltagen.phase2),
      Number(alldata.mains.voltagen.phase3),
    ];
    const filteredValues = allValues.filter(val => val !== 0);

    if (filteredValues.length === 0) {
      const clusterAverage = 0;
      return clusterAverage;
    }
  
    const arithmeticMean = filteredValues.reduce((acc, val) => acc + val, 0) / filteredValues.length;
  
    const clusterAverage = Math.round(arithmeticMean);
  
    return clusterAverage;
  };

  
  // Export the function
  module.exports = {
    calculatePercentages,
    calculateAverageCurrent,
    calculateAverageVoltageL_L,
    calculateAverageVoltageL_N
  };