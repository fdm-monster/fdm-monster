<script>
import Vue from "vue";
import Component from "vue-class-component";

@Component({
  template: `
    <div class="grid-stack-item">
      <div class="grid-stack-item-content">
        <p>
          text
          <slot></slot>
        </p>
      </div>
    </div>
  `
})
export default class GridItem extends Vue {}
</script>
