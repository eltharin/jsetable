<?php

namespace Eltharin\JSETableBundle\Form;

use Symfony\Bridge\Doctrine\Form\Type\EntityType;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;
use Symfony\Component\OptionsResolver\OptionsResolver;

class JseTableEntityType extends AbstractType
{
	public function configureOptions(OptionsResolver $resolver): void
	{
		$resolver->setDefaults([
			'expanded' => true,
			'multiple' => true,
			'header' => [],
			'rows' => [],
			'label_html' => true,
		]);
	}

	public function getParent(): string
	{
		return EntityType::class;
	}

	public function getBlockPrefix(): string
	{
		return "jsetable_entity";
	}

	public function buildView(FormView $view, FormInterface $form, array $options)
	{
		$view->vars['header'] = $options['header'];
	}

	public function finishView(FormView $view, FormInterface $form, array $options)
    {
        $prefixOffset = -1;
        // check if the entry type also defines a block prefix
		foreach ($form as $entry)
		{
			if ($entry->getConfig()->getOption('block_prefix'))
			{
				--$prefixOffset;
			}

			break;
		}

		foreach ($view as $entryView)
		{
			array_splice($entryView->vars['block_prefixes'], $prefixOffset, 0, $this->getBlockPrefix().'_entry');
		}

		if ($prototype = $form->getConfig()->getAttribute('prototype'))
		{
			if ($view->vars['prototype']->vars['multipart'])
			{
				$view->vars['multipart'] = true;
			}

			if ($prefixOffset > -3 && $prototype->getConfig()->getOption('block_prefix'))
			{
				--$prefixOffset;
			}

			array_splice($view->vars['prototype']->vars['block_prefixes'], $prefixOffset, 0, $this->getBlockPrefix().'_entry');
		}
	}
}