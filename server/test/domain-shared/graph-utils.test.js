import graphPoint from "../../utils/graph-point.utils";
const { sumValuesGroupByDate } = graphPoint;
describe("graph-utils", () => {
    it("should be able to call sumValuesGroupByDate", () => {
        expect(sumValuesGroupByDate([])).toEqual([]);
        expect(sumValuesGroupByDate([{ x: 1, y: 1 }])).toMatchObject([
            {
                x: expect.any(Date),
                y: 1
            }
        ]);
    });
});
