export const testRandomDistribution = () => {
    const values = [...new Array(1000)].map(() => Math.floor(Math.random() * 13));
    const counts = {} as { [value: number]: number };
    values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    console.log('random Distribution', { counts, firstValue: values[0] });
};