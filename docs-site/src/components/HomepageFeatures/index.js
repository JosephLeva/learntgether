import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'Purpose Driven Communities',
    Svg: require('@site/static/img/sprite_community.svg').default,
    description: (
      <>
       tgether allows users to build decentralized communities with a clear purpose. 
       Whether it’s fact-checking content, conducting peer reviews, or reaching consensus on shared goals, 
       tgether gives you the tools to customize your community’s structure, governance, and decision-making processes.
      </>
    ),
  },
  {
    title: 'Customizable Consensus',
    Svg: require('@site/static/img/sprite_custom.svg').default,
    description: (
      <>
    tgether embraces the diversity of communities by providing a platform that supports various governance styles. 
    With customizable membership rules, voting processes, and automated arbitration powered by Chainlink, tgether ensures each community has 
    the freedom to define how they reach consensus and achieve their goals.    
     </>
    
    ),
  },
  {
    title: 'Built for Web3',
    Svg: require('@site/static/img/sprite_web3.svg').default,
    description: (
      <>
     tgether is built on a robust web3 stack, leveraging blockchain for secure and immutable data storage. By integrating decentralized automation with Chainlink Oracles, communities can rely on trustless systems to manage proposals, reviews, and consensus without the need for centralized authorities.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
