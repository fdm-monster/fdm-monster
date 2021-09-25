<template>
  <div :id="gridId" class="grid-stack">
    <griditem
      v-for="(item, i) in list"
      :item="item"
      :i="i"
      :key="i"
      :height="options.cellHeight"
    ></griditem>
  </div>
</template>

<script>
import griditem from "./OldGridItem.vue";
import Vue from "vue";
import Component from "vue-class-component";

@Component({
  components:{griditem},
  props: ["gridOptions"],
  data() {
    return {
      msg: "Welcome to Your Vue.js App",
      list: [
        { x: 0, y: 0, h: 4, w: 4, comp: "bar" },
        { x: 0, y: 4, h: 4, w: 4, comp: "myline" },
        { x: 0, y: 8, h: 4, w: 4, comp: "pie" },
        { x: 0, y: 12, h: 4, w: 4, comp: "donut" },
        { x: 0, y: 16, h: 4, w: 4, comp: "bar" },
        { x: 0, y: 20, h: 4, w: 4, comp: "myline" },
        { x: 0, y: 24, h: 4, w: 4, comp: "pie" },
        { x: 0, y: 28, h: 4, w: 4, comp: "donut" }
      ],
      options: {
        cellHeight: 110,
        verticalMargin: 10,
        width: 4,
        draggable: {
          handle: ".grid-stack-handle"
        }
      },
      grid: null
    };
  },

  computed: {
    gridId() {
      return "grid-stack-" + this._uid;
    }
  },
  methods: {
    escKeyFullScreen(e) {
      if (e.keyCode == 27) {
        this.$emit("close-full-screen", {});
      }
    },
    calculateIndexes() {
      // a tad of a hack! manual sync of indexes - not vuey
      let items = [];
      document
          .getElementById(this.gridId)
          .find(".grid-stack-item")
          .each(function (index) {
            const ele = document.getElementById(this).data("_gridstack_node");
            items.push({
              id: ele.el[0].id,
              x: ele.x,
              y: ele.y
            });
          });
      let sortItems = items.sort((a, b) => {
        if (a.y - b.y > 0) {
          return 1;
        } else if (a.y - b.y <= 0 && a.x - b.x > 0) {
          return 1;
        }
        return 0;
      });
      let data = {};
      sortItems.forEach((item, index) => {
        data[item.id] = index;
      });
      event.$emit("re-indexed-items", data);
    },
    emitItemsMoved(e, items) {
      items.forEach((item) => {
        event.$emit("item-moved", { id: item.el[0].id, item: item });
      });
      this.calculateIndexes();
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.options = Object.assign({}, this.options, this.gridOptions);
      this.grid = document.getElementById(this.gridId).gridstack(this.options);
      this.grid.on("change", this.emitItemsMoved);
    });
    document.addEventListener("keyup", this.escKeyFullScreen);
  },
  beforeDestroy() {
    document.removeEventListener("keyup", this.escKeyFullScreen);
  }
})
export default class OldGrid extends Vue {

};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>
.grid-stack-item[data-gs-width="1"] {
  width: 25% !important;
}
.grid-stack-item[data-gs-width="2"] {
  width: 50% !important;
}
.grid-stack-item[data-gs-width="3"] {
  width: 75% !important;
}
.grid-stack-item[data-gs-width="4"] {
  width: 100% !important;
}
.grid-stack-item[data-gs-x=""] {
  left: 0% !important;
}
.grid-stack-item[data-gs-x="1"] {
  left: 25% !important;
}
.grid-stack-item[data-gs-x="2"] {
  left: 50% !important;
}
.grid-stack-item[data-gs-x="3"] {
  left: 75% !important;
}
@media only screen and (max-width: 768px) {
  .grid-stack-item[data-gs-width="1"] {
    width: 100% !important;
  }
  .grid-stack-item[data-gs-width="2"] {
    width: 100% !important;
  }
  .grid-stack-item[data-gs-width="3"] {
    width: 100% !important;
  }
  .grid-stack-item[data-gs-width="4"] {
    width: 100% !important;
  }
  .grid-stack-item[data-gs-x="0"] {
    left: 0% !important;
  }
  .grid-stack-item[data-gs-x="1"] {
    left: 0% !important;
  }
  .grid-stack-item[data-gs-x="2"] {
    left: 0% !important;
  }
  .grid-stack-item[data-gs-x="3"] {
    left: 0% !important;
  }
}
.helper-bar {
  position: absolute;
  top: 0;
  width: 100%;
  z-index: 9999;
}
.helper-bar .items {
  display: inline-flex;
  justify-content: space-around;
  max-height: 0;
  transition: all 0.5s;
  overflow: hidden;
  padding: 10px 20px;
  background-color: #fff;
  color: #fff;
  opacity: 0;
}
.grid-stack-item:hover .helper-bar .items {
  max-height: 1000px;
  background-color: #eee;
  color: #949292;
  opacity: 1;
}
.grid-stack-item-content {
  box-shadow: 0px 0px 11px 5px rgba(238, 238, 238, 1);
}
.sq {
  margin: 2px;
  background-color: #fff;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.sq:hover {
  cursor: pointer;
}
.full-screen {
  background-color: #000;
  position: fixed;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 1;
}
.full-screen .chart-outer {
  background-color: #fff;
  margin: 50px;
}
.relative {
  position: relative;
}
</style>
