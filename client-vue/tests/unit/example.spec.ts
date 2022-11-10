import { shallowMount } from "@vue/test-utils";
import HomeToolbar from "@/components/PrinterGrid/HomeToolbar.vue";

describe("HomeToolbar", () => {
  it("renders props.msg when passed", () => {
    const msg = "new message";
    const wrapper = shallowMount(HomeToolbar, {});
    expect(wrapper.text()).toMatch(msg);
  });
});
