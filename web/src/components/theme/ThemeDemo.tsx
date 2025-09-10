import React from "react";
import styles from "./ThemeDemo.module.css";

const ThemeDemo: React.FC = () => {
  return (
    <div className={styles.themeDemo}>
      <h1>Vuetify 风格主题颜色展示</h1>
      
      <section className={styles.colorSection}>
        <h2>主要颜色 (Primary)</h2>
        <div className={styles.colorRow}>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--primary)" }}>
            <span>Primary</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--primary-lighten-1)" }}>
            <span>Lighten 1</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--primary-lighten-2)" }}>
            <span>Lighten 2</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--primary-darken-1)", color: "white" }}>
            <span>Darken 1</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--primary-darken-2)", color: "white" }}>
            <span>Darken 2</span>
          </div>
        </div>
      </section>

      <section className={styles.colorSection}>
        <h2>辅助颜色 (Secondary)</h2>
        <div className={styles.colorRow}>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--secondary)", color: "white" }}>
            <span>Secondary</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--secondary-lighten-1)", color: "white" }}>
            <span>Lighten 1</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--secondary-lighten-2)", color: "white" }}>
            <span>Lighten 2</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--secondary-darken-1)", color: "white" }}>
            <span>Darken 1</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--secondary-darken-2)", color: "white" }}>
            <span>Darken 2</span>
          </div>
        </div>
      </section>

      <section className={styles.colorSection}>
        <h2>强调色 (Accent)</h2>
        <div className={styles.colorRow}>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--accent)" }}>
            <span>Accent</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--accent-lighten-1)" }}>
            <span>Lighten 1</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--accent-lighten-2)" }}>
            <span>Lighten 2</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--accent-darken-1)", color: "white" }}>
            <span>Darken 1</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--accent-darken-2)", color: "white" }}>
            <span>Darken 2</span>
          </div>
        </div>
      </section>

      <section className={styles.colorSection}>
        <h2>状态颜色</h2>
        <div className={styles.colorRow}>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--success)" }}>
            <span>Success</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--info)" }}>
            <span>Info</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--warning)" }}>
            <span>Warning</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--error)" }}>
            <span>Error</span>
          </div>
        </div>
      </section>

      <section className={styles.colorSection}>
        <h2>中性色</h2>
        <div className={styles.colorRow}>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--white)", border: "1px solid #eee" }}>
            <span>White</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--black)", color: "white" }}>
            <span>Black</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--bg-color)" }}>
            <span>BG Color</span>
          </div>
          <div className={styles.colorBox} style={{ backgroundColor: "var(--bg-color-secondary)" }}>
            <span>BG Secondary</span>
          </div>
        </div>
      </section>

      <section className={styles.colorSection}>
        <h2>文本颜色</h2>
        <div className={styles.textRow}>
          <div className={styles.textBox} style={{ color: "var(--text-primary)", backgroundColor: "var(--bg-color)" }}>
            <span>Text Primary</span>
          </div>
          <div className={styles.textBox} style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-color)" }}>
            <span>Text Secondary</span>
          </div>
          <div className={styles.textBox} style={{ color: "var(--text-disabled)", backgroundColor: "var(--bg-color)" }}>
            <span>Text Disabled</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ThemeDemo;
