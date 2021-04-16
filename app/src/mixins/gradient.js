import grad from "gradient-from-image";
import { colorBrightness } from "../assets/plugins/utils.js";

export default {
    data() {
        return {
            gradientColor: ''
        }
    },
    computed: {
        artStyle() {
            return `background: linear-gradient(${this.gradientColor} -${Math.max(colorBrightness(this.gradientColor) - 10, 0)}vh, #1e1e1e 120vh)`;
        }
    },
    methods: {
        loadGradient(imageUrl) {
            if (!imageUrl) {
                this.gradientColor = null;
                return;
            }

            return grad.gr(imageUrl).then(gradient => {
                this.gradientColor = gradient.relevant[0];
            });
        }
    }
}
