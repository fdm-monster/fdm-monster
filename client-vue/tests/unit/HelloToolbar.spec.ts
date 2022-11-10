import { shallowMount } from "@vue/test-utils";
import HelloToolbar from "@/components/PrinterGrid/HelloToolbar.vue";

describe("HelloToolbar", () => {
  it("renders props.msg when passed", () => {
    const msg = "new message";
    const wrapper = shallowMount(HelloToolbar, {});
    expect(wrapper.text()).toMatch(msg);
  });
});
